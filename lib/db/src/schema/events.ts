import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { villagesTable } from "./villages";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  villageId: integer("village_id").references(() => villagesTable.id, { onDelete: "set null" }),
  location: text("location"),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageObjectPath: text("image_object_path"),
  contactInfo: text("contact_info"),
  senderName: text("sender_name").notNull(),
  status: text("status").notNull().default("pending"),
  consentGiven: boolean("consent_given").notNull().default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  status: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventSubmission = typeof eventsTable.$inferSelect;
