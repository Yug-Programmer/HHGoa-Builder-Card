import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role"),
  stack: text("stack"),
  country: text("country"),
  githubUsername: text("github_username"),
  builderTitle: text("builder_title"),
  imagePath: text("image_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
