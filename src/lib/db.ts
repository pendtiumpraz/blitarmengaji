import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../db/schema";

// DATABASE_URL diisi di .env.local (Neon). Placeholder agar build/typecheck
// tetap jalan sebelum kredensial dipasang; query nyata butuh URL asli.
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
