import { neon } from '@neondatabase/serverless';

// Some Vercel Postgres integrations (e.g. Neon connected with a custom
// "Environment Variable Prefix") inject the connection string under a
// project-prefixed name like "<prefix>_POSTGRES_URL" instead of a plain
// DATABASE_URL. Since the prefix is project-specific, discover it by
// scanning for the first plausible match rather than hardcoding it.
function isConnectionString(value: string | undefined): value is string {
  return !!value && /^postgres(ql)?:\/\//i.test(value);
}

function resolveDatabaseUrl(): string {
  const env = process.env;

  if (isConnectionString(env.DATABASE_URL)) return env.DATABASE_URL;
  if (isConnectionString(env.POSTGRES_URL)) return env.POSTGRES_URL;

  // Prefer pooled connection strings over unpooled ones (important for
  // serverless, where many concurrent function instances share the pool).
  const suffixesByPriority = [
    '_DATABASE_URL',
    '_POSTGRES_URL',
    '_POSTGRES_PRISMA_URL',
    '_PGDATABASE',
    '_DATABASE_URL_UNPOOLED',
    '_POSTGRES_URL_NON_POOLING',
  ];

  for (const suffix of suffixesByPriority) {
    const matchingKey = Object.keys(env).find((key) => key.endsWith(suffix) && isConnectionString(env[key]));
    if (matchingKey) return env[matchingKey] as string;
  }

  throw new Error(
    'No Postgres connection string found in environment. Connect a Postgres database to this project (see README) so DATABASE_URL, POSTGRES_URL, or a prefixed equivalent (e.g. <project>_POSTGRES_URL) is set.'
  );
}

export const sql = neon(resolveDatabaseUrl());

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
  projectId?: string;
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
  project_id: string | null;
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
    projectId: row.project_id ?? undefined,
    viewCount: row.view_count,
    isPermanent: row.is_permanent,
  };
}

export async function insertPreview(bundle: StoredPreviewBundle): Promise<void> {
  await sql`
    INSERT INTO previews (
      id, title, html, css, js, created_at, expires_at, expiry_rule,
      author_id, author_name, project_id, view_count, is_permanent
    ) VALUES (
      ${bundle.id}, ${bundle.title}, ${bundle.html}, ${bundle.css}, ${bundle.js},
      ${bundle.createdAt}, ${bundle.expiresAt}, ${bundle.expiryRule},
      ${bundle.authorId ?? null}, ${bundle.authorName ?? null}, ${bundle.projectId ?? null},
      ${bundle.viewCount}, ${bundle.isPermanent}
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
