// NOTE: The Supabase JS client has NO createTable() method.
// It is a query builder (SELECT/INSERT/UPDATE/DELETE), not a DDL tool.
//
// ✅ CORRECT approach for this project (Prisma):
//   1. Define the model in /backend/prisma/schema.prisma
//   2. Run: npx prisma migrate dev --name create_users
//
// This script is kept as a connectivity check only.

import { supabase } from "./supabase.js";

try {
  // Simple connectivity test — list rows from an existing table
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) throw error;
  console.log('✅ Connected. Rows:', data);
} catch (error) {
  console.error('❌ Error:', error.message);
}