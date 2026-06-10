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
    logger.info("DB migrations applied");
  } catch (err) {
    logger.error({ err }, "Migration failed");
  } finally {
    client.release();
  }
}
