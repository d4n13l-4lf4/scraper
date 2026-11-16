import { describe, it, expect } from 'vitest';
import { createSqliteConnection } from '@/shared/infrastructure/sqlite-connection.js';

describe('createSqliteConnection', () => {
  it('should create an in-memory database connection', () => {
    const db = createSqliteConnection(':memory:');
    expect(db).toBeDefined();
    expect(typeof db.prepare).toBe('function');
    expect(typeof db.close).toBe('function');
    db.close();
  });

  it('should create a table and insert data', () => {
    const db = createSqliteConnection(':memory:');
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    db.exec("INSERT INTO test (name) VALUES ('test')");

    const row = db.prepare('SELECT name FROM test WHERE id = 1').get() as { name: string };
    expect(row.name).toBe('test');

    db.close();
  });
});
