import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const villagesTable = pgTable("villages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEl: text("name_el").notNull(),
  description: text("description").notNull(),
  municipalUnit: text("municipal_unit"),
  population: integer("population"),
  elevation: integer("elevation"),
  imageUrl: text("image_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  richContent: text("rich_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVillageSchema = createInsertSchema(villagesTable).omit({ id: true, createdAt: true });
export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type Village = typeof villagesTable.$inferSelect;
