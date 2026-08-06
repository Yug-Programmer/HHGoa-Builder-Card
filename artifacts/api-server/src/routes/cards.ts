import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";
import { SaveCardBody, GetCardParams } from "@workspace/api-zod";

const router: IRouter = Router();

const CARDS_DIR =
  process.env.CARDS_DIR ||
  (process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "uploads", "cards"));

try {
  if (!fs.existsSync(CARDS_DIR)) {
    fs.mkdirSync(CARDS_DIR, { recursive: true });
  }
} catch (e) {
  // Directory creation might fail in read-only environment, which is handled gracefully when saving
}

function getBaseUrl(req: import("express").Request): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  return `${protocol}://${host}`;
}

// POST /api/cards — save a generated card
router.post("/cards", async (req, res): Promise<void> => {
  const parsed = SaveCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    imageBase64, name, role, stack, country,
    githubUsername, instagramHandle, linkedinHandle, email, builderTitle, gmail, mobileNumber,
  } = parsed.data;

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  let imagePathValue: string;
  let tempFilePath: string | null = null;

  // Try writing to disk if available
  try {
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tempFilePath = path.join(CARDS_DIR, `${tempId}.png`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
    imagePathValue = `${tempId}.png`;
  } catch {
    // If disk write fails (e.g. read-only filesystem on Vercel), store as base64 in DB
    imagePathValue = `base64:${base64Data}`;
  }

  let card: typeof cardsTable.$inferSelect;
  try {
    const [inserted] = await db
      .insert(cardsTable)
      .values({
        name,
        role: role ?? null,
        stack: stack ?? null,
        country: country ?? null,
        githubUsername: githubUsername ?? null,
        instagramHandle: instagramHandle ?? null,
        linkedinHandle: linkedinHandle ?? null,
        email: email ?? null,
        builderTitle: builderTitle ?? null,
        gmail: gmail ?? null,
        mobileNumber: mobileNumber ?? null,
        imagePath: imagePathValue,
      })
      .returning();
    card = inserted;
  } catch (err) {
    req.log.error({ err }, "Failed to insert card into DB");
    if (tempFilePath) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    res.status(500).json({ error: "Failed to save card metadata" });
    return;
  }

  if (tempFilePath && !imagePathValue.startsWith("base64:")) {
    const finalFilename = `${card.id}.png`;
    const finalFilePath = path.join(CARDS_DIR, finalFilename);
    try {
      fs.renameSync(tempFilePath, finalFilePath);
      await db
        .update(cardsTable)
        .set({ imagePath: finalFilename })
        .where(eq(cardsTable.id, card.id));
      card.imagePath = finalFilename;
    } catch (err) {
      req.log.warn({ err }, "Failed to rename card image file");
    }
  }

  const base = getBaseUrl(req);
  res.status(201).json({
    id: card.id,
    name: card.name,
    role: card.role ?? null,
    stack: card.stack ?? null,
    country: card.country ?? null,
    githubUsername: card.githubUsername ?? null,
    instagramHandle: card.instagramHandle ?? null,
    linkedinHandle: card.linkedinHandle ?? null,
    email: card.email ?? null,
    builderTitle: card.builderTitle ?? null,
    imageUrl: `${base}/api/cards/${card.id}/image`,
    shareUrl: `${base}/cards/${card.id}`,
    createdAt: card.createdAt.toISOString(),
  });
});

// GET /api/cards/:id — get card metadata (public, no private fields)
router.get("/cards/:id", async (req, res): Promise<void> => {
  const params = GetCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, params.data.id));

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const base = getBaseUrl(req);
  res.json({
    id: card.id,
    name: card.name,
    role: card.role ?? null,
    stack: card.stack ?? null,
    country: card.country ?? null,
    githubUsername: card.githubUsername ?? null,
    instagramHandle: card.instagramHandle ?? null,
    linkedinHandle: card.linkedinHandle ?? null,
    email: card.email ?? null,
    builderTitle: card.builderTitle ?? null,
    imageUrl: `${base}/api/cards/${card.id}/image`,
    shareUrl: `${base}/cards/${card.id}`,
    createdAt: card.createdAt.toISOString(),
  });
});

// GET /api/cards/:id/image — serve the card PNG
router.get("/cards/:id/image", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, rawId));

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  if (card.imagePath.startsWith("base64:")) {
    const imgBuffer = Buffer.from(card.imagePath.slice(7), "base64");
    res.setHeader("Content-Length", imgBuffer.length.toString());
    res.send(imgBuffer);
    return;
  }

  const filePath = path.join(CARDS_DIR, card.imagePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }

  res.status(404).json({ error: "Card image not found" });
});

// GET /cards/:id — Twitter/social bot detection
// When X's crawler visits this URL, it gets HTML with Twitter Card meta tags
// so the card image appears automatically in the tweet preview.
// Real users get redirected to the SPA.
const BOT_UA = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|TelegramBot|Discordbot|WhatsApp|Googlebot|bingbot/i;

router.get("/cards/:id", async (req, res): Promise<void> => {
  const ua = req.headers["user-agent"] || "";

  // If it's NOT a bot, let the SPA handle it (Vercel serves index.html)
  if (!BOT_UA.test(ua)) {
    // In dev mode, redirect to SPA. In production Vercel handles this via rewrites.
    res.redirect(`/?card=${req.params.id}`);
    return;
  }

  // Bot/crawler — serve HTML with Twitter Card meta tags
  const rawId = req.params.id;
  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, rawId));

  if (!card) {
    res.status(404).send("Card not found");
    return;
  }

  const base = getBaseUrl(req);
  const imageUrl = `${base}/api/cards/${card.id}/image`;
  const pageUrl = `${base}/cards/${card.id}`;
  const title = `${card.name}'s HH Goa Builder Card`;
  const description = card.builderTitle
    ? `${card.name} — ${card.builderTitle} | Hacker House Goa 2026 #FrameInGoa`
    : `${card.name} | Hacker House Goa 2026 #FrameInGoa`;

  // Return minimal HTML with Open Graph + Twitter Card meta tags
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1350">
  <meta property="og:image:height" content="957">
  <meta property="og:url" content="${pageUrl}">

  <!-- Twitter Card — summary_large_image shows the full card image -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
  <h1>${title}</h1>
  <img src="${imageUrl}" alt="${title}">
  <p>${description}</p>
  <p><a href="/">Create your own card</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(html);
});

export default router;
