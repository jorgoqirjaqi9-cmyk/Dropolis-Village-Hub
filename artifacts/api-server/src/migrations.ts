import { pool } from "@workspace/db";
import { logger } from "./lib/logger.js";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url text
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS articles_source_url_unique
        ON articles(source_url)
        WHERE source_url IS NOT NULL
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS news_submissions (
        id serial PRIMARY KEY,
        title text NOT NULL,
        content text NOT NULL,
        village_id integer REFERENCES villages(id) ON DELETE SET NULL,
        sender_name text NOT NULL,
        sender_email text,
        event_date text NOT NULL,
        event_time text,
        image_url text,
        status text NOT NULL DEFAULT 'pending',
        consent_given boolean NOT NULL DEFAULT false,
        submitted_at timestamp NOT NULL DEFAULT now(),
        reviewed_at timestamp
      )
    `);
    logger.info("DB migrations applied");
  } catch (err) {
    logger.error({ err }, "Migration failed");
  } finally {
    client.release();
  }
}
