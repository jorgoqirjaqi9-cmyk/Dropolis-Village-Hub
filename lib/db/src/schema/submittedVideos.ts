import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const submittedVideosTable = pgTable("submitted_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  objectPath: text("object_path").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailObjectPath: text("thumbnail_object_path"),
  villageId: integer("village_id"),
  villageName: text("village_name"),
  uploaderName: text("uploader_name"),
  uploaderEmail: text("uploader_email"),
  eventDate: text("event_date"),
  copyrightConfirmed: boolean("copyright_confirmed").notNull().default(false),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type SubmittedVideo = typeof submittedVideosTable.$inferSelect;
