import 'dotenv/config';
import { sql } from '../lib/db';

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS previews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      html TEXT NOT NULL,
      css TEXT NOT NULL,
      js TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      expires_at BIGINT,
      expiry_rule TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      view_count INTEGER NOT NULL DEFAULT 0,
      is_permanent BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS previews_author_id_idx ON previews (author_id)`;

  console.log('Database schema is ready: "previews" table exists.');
}

main()
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
