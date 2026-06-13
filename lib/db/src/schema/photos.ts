import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  villageId: integer("village_id"),
  villageName: text("village_name"),
  photographer: text("photographer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull().default("approved"),
  objectPath: text("object_path"),
  thumbnailObjectPath: text("thumbnail_object_path"),
  copyrightConfirmed: boolean("copyright_confirmed").notNull().default(false),
  uploaderName: text("uploader_name"),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true, createdAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;
