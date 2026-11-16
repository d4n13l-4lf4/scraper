/**
 * Raised before network activity when an unsupported filter id is requested.
 */
export class InvalidFilterError extends Error {
  readonly code = 'invalid_filter';
  constructor(message?: string) {
    super(message ?? 'The requested filter is not supported.');
    this.name = 'InvalidFilterError';
  }
}

/**
 * Raised when the upstream request times out.
 */
export class UpstreamTimeoutError extends Error {
  readonly code = 'upstream_timeout';
  constructor(message?: string) {
    super(message ?? 'The upstream request timed out.');
    this.name = 'UpstreamTimeoutError';
  }
}

/**
 * Raised when the upstream service is unreachable or returns a non-success status.
 */
export class UpstreamUnavailableError extends Error {
  readonly code = 'upstream_unavailable';
  constructor(message?: string) {
    super(message ?? 'The upstream service could not be reached.');
    this.name = 'UpstreamUnavailableError';
  }
}

/**
 * Raised when the retrieved page contains no story rows.
 */
export class PageStructureError extends Error {
  readonly code = 'page_structure';
  constructor(message?: string) {
    super(message ?? 'The upstream page contained no story rows.');
    this.name = 'PageStructureError';
  }
}

/**
 * Raised when usage persistence fails.
 */
export class PersistenceError extends Error {
  readonly code = 'internal_error';
  constructor(message?: string) {
    super(message ?? 'Usage persistence failed.');
    this.name = 'PersistenceError';
  }
}
