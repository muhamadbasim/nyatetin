import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || './data/catat_uang.db';

let db: SqlJsDatabase | null = null;
let SQL: initSqlJs.SqlJsStatic | null = null;

export async function initSql(): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    await initSql();
    
    // Ensure data directory exists
    const dataDir = dirname(DB_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    // Load existing database or create new one
    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH);
      db = new SQL!.Database(buffer);
    } else {
      db = new SQL!.Database();
    }
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();
  
  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  database.run(schema);
  saveDatabase();
  console.log('✅ Database initialized');
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    
    const dataDir = dirname(DB_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    writeFileSync(DB_PATH, buffer);
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// For testing - reset database
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  database.run('DELETE FROM transactions');
  database.run('DELETE FROM users');
  saveDatabase();
}

// Helper to run queries
export async function runQuery(sql: string, params: any[] = []): Promise<void> {
  const database = await getDatabase();
  database.run(sql, params);
  saveDatabase();
}

export async function getOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const database = await getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  
  stmt.free();
  return null;
}

export async function getAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  
  stmt.free();
  return results;
}
