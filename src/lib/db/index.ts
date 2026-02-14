import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = 'data/rachel-cloud.db';

// Ensure data directory exists
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

// Create singleton database instance
const sqlite = new Database(dbPath, { create: true });

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON;');

// Create Drizzle client
export const db = drizzle(sqlite, { schema });
