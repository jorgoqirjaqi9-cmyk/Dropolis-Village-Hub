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
    await client.query(`
      CREATE TABLE IF NOT EXISTS submitted_videos (
        id serial PRIMARY KEY,
        title text NOT NULL,
        description text,
        video_url text NOT NULL,
        object_path text NOT NULL,
        thumbnail_url text,
        thumbnail_object_path text,
        village_id integer REFERENCES villages(id) ON DELETE SET NULL,
        village_name text,
        uploader_name text,
        uploader_email text,
        event_date text,
        copyright_confirmed boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT now(),
        reviewed_at timestamp
      )
    `);
    await client.query(`
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE submitted_videos ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE submitted_videos ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_votes (
        id serial PRIMARY KEY,
        content_type text NOT NULL,
        content_id integer NOT NULL,
        voter_key text NOT NULL,
        vote_type text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS content_votes_unique
        ON content_votes(content_type, content_id, voter_key)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id serial PRIMARY KEY,
        title text NOT NULL,
        event_date text NOT NULL,
        event_time text,
        village_id integer REFERENCES villages(id) ON DELETE SET NULL,
        location text,
        description text NOT NULL,
        image_url text,
        image_object_path text,
        contact_info text,
        sender_name text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        consent_given boolean NOT NULL DEFAULT false,
        submitted_at timestamp NOT NULL DEFAULT now(),
        reviewed_at timestamp
      )
    `);
    // Data fix: replace wrong spelling Ποκόνι/Ποκονίου → Πωγώνι/Πωγωνίου in village rich_content
    await client.query(`
      UPDATE villages
      SET rich_content = REPLACE(REPLACE(rich_content, 'Ποκονίου', 'Πωγωνίου'), 'Ποκόνι', 'Πωγώνι')
      WHERE rich_content ILIKE '%Ποκόν%' OR rich_content ILIKE '%Ποκον%'
    `);
    // Data fix: replace Ποκονίου → Πωγωνίου in descriptions
    await client.query(`
      UPDATE villages
      SET description = REPLACE(description, 'Ποκονίου', 'Πωγωνίου')
      WHERE description ILIKE '%Ποκονίου%'
    `);
    // Data fix: remove duplicate "Δημοτική Ενότητα Δημοτική Ενότητα" in rich_content
    await client.query(`
      UPDATE villages
      SET rich_content = REPLACE(rich_content, 'Δημοτική Ενότητα Δημοτική Ενότητα', 'Δημοτική Ενότητα')
      WHERE rich_content ILIKE '%Δημοτική Ενότητα Δημοτική Ενότητα%'
    `);
    // Data fix: specific village descriptions with wrong municipal unit
    await client.query(`
      UPDATE villages SET description = 'Χωριό Κάτω Δρόπολης με ελληνόφωνη κοινότητα, παραδοσιακές κοινοτικές δομές και εντυπωσιακό ορεινό τοπίο με θέα στην κοιλάδα του Δρίνου.'
      WHERE id = 60 AND description ILIKE '%Άνω Δρόπολης%'
    `);
    await client.query(`
      UPDATE villages SET description = 'Η Σωτήρα είναι χωριό Άνω Δρόπολης με ελληνόφωνους κατοίκους, παλαιά εκκλησία αφιερωμένη στον Σωτήρα Χριστό και κεντρική θέση στην παράδοση της πολυφωνικής μουσικής.'
      WHERE id = 77 AND description ILIKE '%Κάτω Δρόπολης%'
    `);
    await client.query(`
      UPDATE villages SET description = 'Ελληνόφωνο χωριό της Δημοτικής Ενότητας Πωγωνίου με παραδοσιακή εκκλησία, πολυφωνικά τραγούδια και ορεινό τοπίο με κρυστάλλινες πηγές.'
      WHERE id = 89
    `);
    await client.query(`
      UPDATE villages SET description = 'Ελληνόφωνο χωριό της Δημοτικής Ενότητας Πωγωνίου με αγροτική παράδοση και ειδυλλιακό τοπίο. Τμήμα του Δήμου Δρόπολης με ζωντανή ορθόδοξη κοινότητα.'
      WHERE id = 91
    `);
    await client.query(`
      UPDATE villages SET description = 'Χωριό της Δημοτικής Ενότητας Κάτω Δρόπολης με πλούσια ιστορία, παραδοσιακή αρχιτεκτονική και ελληνόφωνη κοινότητα με ζωντανά πολιτιστικά ήθη.'
      WHERE id = 64 AND description ILIKE '%Άνω Δρόπολης%'
    `);
    await client.query(`
      UPDATE villages SET description = 'Χωριό της Δημοτικής Ενότητας Κάτω Δρόπολης με πανοραμική θέα στην κοιλάδα και παραδοσιακά σπίτια διατηρημένα από γενιές ελληνόφωνων κατοίκων.'
      WHERE id = 58 AND description ILIKE '%Άνω Δρόπολης%'
    `);
    await client.query(`
      UPDATE villages SET description = 'Χωριό της Δημοτικής Ενότητας Κάτω Δρόπολης με παλαιά εκκλησία, ελληνόφωνους κατοίκους και αγροτική παράδοση στην καρδιά της κοιλάδας του Δρίνου.'
      WHERE id = 52 AND description ILIKE '%Άνω Δρόπολης%'
    `);
    logger.info("DB migrations applied");
  } catch (err) {
    logger.error({ err }, "Migration failed");
  } finally {
    client.release();
  }
}
