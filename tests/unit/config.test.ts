import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '@/config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env vars are set', () => {
    delete process.env.PORT;
    delete process.env.HN_URL;
    delete process.env.REQUEST_TIMEOUT_MS;
    delete process.env.DB_PATH;
    delete process.env.NODE_ENV;

    const config = loadConfig();
    expect(config.port).toBe(3000);
    expect(config.hnUrl).toBe('https://news.ycombinator.com/');
    expect(config.requestTimeoutMs).toBe(10000);
    expect(config.dbPath).toBe('data/hacker-news.db');
    expect(config.nodeEnv).toBe('development');
  });

  it('should read values from environment variables', () => {
    process.env.PORT = '8080';
    process.env.HN_URL = 'https://example.com/';
    process.env.REQUEST_TIMEOUT_MS = '5000';
    process.env.DB_PATH = '/tmp/test.db';
    process.env.NODE_ENV = 'test';

    const config = loadConfig();
    expect(config.port).toBe(8080);
    expect(config.hnUrl).toBe('https://example.com/');
    expect(config.requestTimeoutMs).toBe(5000);
    expect(config.dbPath).toBe('/tmp/test.db');
    expect(config.nodeEnv).toBe('test');
  });

  it('should default port to 3000 when invalid', () => {
    process.env.PORT = 'not-a-number';

    const config = loadConfig();
    expect(config.port).toBe(3000);
  });

  it('should default timeout to 10000 when invalid', () => {
    process.env.REQUEST_TIMEOUT_MS = 'invalid';

    const config = loadConfig();
    expect(config.requestTimeoutMs).toBe(10000);
  });
});
