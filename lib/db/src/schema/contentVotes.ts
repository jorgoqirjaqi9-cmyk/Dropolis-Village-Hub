import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const contentVotesTable = pgTable("content_votes", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  voterKey: text("voter_key").notNull(),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueVote: uniqueIndex("content_votes_unique").on(table.contentType, table.contentId, table.voterKey),
}));

export type ContentVote = typeof contentVotesTable.$inferSelect;
