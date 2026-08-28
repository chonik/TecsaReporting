import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@dummy.neon.tech/dummy?sslmode=require";

// Lazy / Safe client for build time and runtime
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
