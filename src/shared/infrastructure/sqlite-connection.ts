/**
 * SQLite connection factory.
 *
 * Creates and exports a better-sqlite3 database connection. Uses
 * an in-memory database in tests, a file-based database in production.
 */

import Database from 'better-sqlite3';

export function createSqliteConnection(dbPath: string): Database.Database {
  return new Database(dbPath);
}
