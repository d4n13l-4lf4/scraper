/**
 * Configuration module.
 *
 * Reads environment variables once and exposes typed configuration values.
 * process.env is not read anywhere else in the application.
 */

export interface AppConfig {
  readonly port: number;
  readonly hnUrl: string;
  readonly requestTimeoutMs: number;
  readonly dbPath: string;
  readonly nodeEnv: string;
}

function readEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : fallback;
}

function readPort(): number {
  const value = readEnv('PORT', '3000');
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 3000 : parsed;
}

function readTimeoutMs(): number {
  const value = readEnv('REQUEST_TIMEOUT_MS', '10000');
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 10000 : parsed;
}

export function loadConfig(): AppConfig {
  return {
    port: readPort(),
    hnUrl: readEnv('HN_URL', 'https://news.ycombinator.com/'),
    requestTimeoutMs: readTimeoutMs(),
    dbPath: readEnv('DB_PATH', 'data/hacker-news.db'),
    nodeEnv: readEnv('NODE_ENV', 'development'),
  };
}
