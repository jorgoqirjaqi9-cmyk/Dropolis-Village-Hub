import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { villagesTable } from "./villages";

export const newsSubmissionsTable = pgTable("news_submissions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  villageId: integer("village_id").references(() => villagesTable.id, { onDelete: "set null" }),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email"),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  consentGiven: boolean("consent_given").notNull().default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertNewsSubmissionSchema = createInsertSchema(newsSubmissionsTable).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  status: true,
});
export type InsertNewsSubmission = z.infer<typeof insertNewsSubmissionSchema>;
export type NewsSubmission = typeof newsSubmissionsTable.$inferSelect;
