import { Router, type IRouter } from "express";
import { desc, count } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";
import { AdminLoginBody, AdminListCardsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// Hardcoded admin credentials and token
const ADMIN_USERNAME = "HHGOA";
const ADMIN_PASSWORD = "HHGOA777";
const ADMIN_TOKEN = "HHGOA-ADMIN-2026-SECRET-TOKEN";

function requireAdmin(req: import("express").Request, res: import("express").Response): boolean {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const token = auth.slice(7);
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Invalid token" });
    return false;
  }
  return true;
}

function getBaseUrl(req: import("express").Request): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  return `${protocol}://${host}`;
}

// POST /api/admin/login
router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ token: ADMIN_TOKEN });
});

// GET /api/admin/cards
router.get("/admin/cards", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const queryParams = AdminListCardsQueryParams.safeParse(req.query);
  const page = queryParams.success ? Math.max(1, queryParams.data.page ?? 1) : 1;
  const limit = queryParams.success ? Math.min(100, queryParams.data.limit ?? 50) : 50;
  const offset = (page - 1) * limit;

  const [cards, totalResult] = await Promise.all([
    db
      .select()
      .from(cardsTable)
      .orderBy(desc(cardsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(cardsTable),
  ]);

  const base = getBaseUrl(req);
  const total = totalResult[0]?.value ?? 0;

  res.json({
    cards: cards.map((card) => ({
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
      gmail: card.gmail ?? null,
      mobileNumber: card.mobileNumber ?? null,
      imageUrl: `${base}/api/cards/${card.id}/image`,
      shareUrl: `${base}/cards/${card.id}`,
      createdAt: card.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

export default router;
