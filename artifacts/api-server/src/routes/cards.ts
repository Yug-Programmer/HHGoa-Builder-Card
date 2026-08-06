import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";
import { SaveCardBody, GetCardParams } from "@workspace/api-zod";

const router: IRouter = Router();

// Directory for storing generated card images
const CARDS_DIR =
  process.env.CARDS_DIR ||
  path.join(process.cwd(), "uploads", "cards");

// Ensure the directory exists at startup
if (!fs.existsSync(CARDS_DIR)) {
  fs.mkdirSync(CARDS_DIR, { recursive: true });
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

  const { imageBase64, name, role, stack, country, githubUsername, builderTitle } =
    parsed.data;

  // Strip base64 prefix if present (data:image/png;base64,...)
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  // Generate a temporary ID for the file; we'll get the real UUID from DB insert
  const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tempFilename = `${tempId}.png`;
  const tempFilePath = path.join(CARDS_DIR, tempFilename);

  try {
    // Write the image to disk
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
  } catch (err) {
    req.log.error({ err }, "Failed to write card image to disk");
    res.status(500).json({ error: "Failed to save card image" });
    return;
  }

  // Insert card metadata into DB
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
        builderTitle: builderTitle ?? null,
        imagePath: tempFilename,
      })
      .returning();
    card = inserted;
  } catch (err) {
    req.log.error({ err }, "Failed to insert card into DB");
    // Clean up the temp file
    try { fs.unlinkSync(tempFilePath); } catch {}
    res.status(500).json({ error: "Failed to save card metadata" });
    return;
  }

  // Rename the file to use the real UUID
  const finalFilename = `${card.id}.png`;
  const finalFilePath = path.join(CARDS_DIR, finalFilename);
  try {
    fs.renameSync(tempFilePath, finalFilePath);
    // Update imagePath in DB
    await db
      .update(cardsTable)
      .set({ imagePath: finalFilename })
      .where(eq(cardsTable.id, card.id));
    card.imagePath = finalFilename;
  } catch (err) {
    req.log.warn({ err }, "Failed to rename card image file; using temp name");
  }

  const base = getBaseUrl(req);
  const imageUrl = `${base}/api/cards/${card.id}/image`;
  const shareUrl = `${base}/cards/${card.id}`;

  res.status(201).json({
    id: card.id,
    name: card.name,
    role: card.role ?? null,
    stack: card.stack ?? null,
    country: card.country ?? null,
    githubUsername: card.githubUsername ?? null,
    builderTitle: card.builderTitle ?? null,
    imageUrl,
    shareUrl,
    createdAt: card.createdAt.toISOString(),
  });
});

// GET /api/cards/:id — get card metadata
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
  const imageUrl = `${base}/api/cards/${card.id}/image`;
  const shareUrl = `${base}/cards/${card.id}`;

  res.json({
    id: card.id,
    name: card.name,
    role: card.role ?? null,
    stack: card.stack ?? null,
    country: card.country ?? null,
    githubUsername: card.githubUsername ?? null,
    builderTitle: card.builderTitle ?? null,
    imageUrl,
    shareUrl,
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

  const filePath = path.join(CARDS_DIR, card.imagePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Card image not found" });
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(filePath);
});

export default router;
