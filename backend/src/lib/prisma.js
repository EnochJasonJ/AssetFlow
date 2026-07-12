import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Fix common Supabase connection string mismatch where pooler username (postgres.project_ref)
// is used against the direct database host (db.project_ref.supabase.co)
try {
  const url = new URL(connectionString);
  if (url.hostname.startsWith('db.') && url.hostname.endsWith('.supabase.co') && url.username.startsWith('postgres.')) {
    url.username = 'postgres';
    connectionString = url.toString();
  }
} catch (e) {
  // Use connectionString as-is if URL parsing fails
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
