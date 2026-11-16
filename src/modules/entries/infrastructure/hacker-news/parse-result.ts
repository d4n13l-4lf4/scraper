/**
 * Represents either a successful row value or a row-level parse error.
 */
export interface ParseOk<T> {
  readonly ok: true;
  readonly value: T;
}

export interface ParseError<T> {
  readonly ok: false;
  readonly error: Error;
  readonly row?: T;
}

export type ParseResult<T> = ParseOk<T> | ParseError<T>;
