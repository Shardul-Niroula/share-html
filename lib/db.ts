import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Connect a Postgres database to this project (see README) and set DATABASE_URL in your environment.'
  );
}

export const sql = neon(process.env.DATABASE_URL);

export interface StoredPreviewBundle {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  expiresAt: number | null;
  expiryRule: string;
  authorId?: string;
  authorName?: string;
  viewCount: number;
  isPermanent: boolean;
}

interface PreviewRow {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  created_at: string;
  expires_at: string | null;
  expiry_rule: string;
  author_id: string | null;
  author_name: string | null;
  view_count: number;
  is_permanent: boolean;
}

function rowToBundle(row: PreviewRow): StoredPreviewBundle {
  return {
    id: row.id,
    title: row.title,
    html: row.html,
    css: row.css,
    js: row.js,
    createdAt: Number(row.created_at),
    expiresAt: row.expires_at === null ? null : Number(row.expires_at),
    expiryRule: row.expiry_rule,
    authorId: row.author_id ?? undefined,
    authorName: row.author_name ?? undefined,
    viewCount: row.view_count,
    isPermanent: row.is_permanent,
  };
}

export async function insertPreview(bundle: StoredPreviewBundle): Promise<void> {
  await sql`
    INSERT INTO previews (
      id, title, html, css, js, created_at, expires_at, expiry_rule,
      author_id, author_name, view_count, is_permanent
    ) VALUES (
      ${bundle.id}, ${bundle.title}, ${bundle.html}, ${bundle.css}, ${bundle.js},
      ${bundle.createdAt}, ${bundle.expiresAt}, ${bundle.expiryRule},
      ${bundle.authorId ?? null}, ${bundle.authorName ?? null}, ${bundle.viewCount}, ${bundle.isPermanent}
    )
  `;
}

export async function getPreview(id: string): Promise<StoredPreviewBundle | null> {
  const rows = (await sql`SELECT * FROM previews WHERE id = ${id}`) as unknown as PreviewRow[];
  if (rows.length === 0) return null;
  return rowToBundle(rows[0]);
}

export async function incrementViewCount(id: string): Promise<void> {
  await sql`UPDATE previews SET view_count = view_count + 1 WHERE id = ${id}`;
}

export async function deletePreview(id: string): Promise<boolean> {
  const rows = (await sql`DELETE FROM previews WHERE id = ${id} RETURNING id`) as unknown as { id: string }[];
  return rows.length > 0;
}

export async function getPreviewsByAuthor(authorId: string): Promise<StoredPreviewBundle[]> {
  const rows = (await sql`
    SELECT * FROM previews WHERE author_id = ${authorId} ORDER BY created_at DESC
  `) as unknown as PreviewRow[];
  return rows.map(rowToBundle);
}

export async function countActivePreviews(): Promise<number> {
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM previews`) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}
