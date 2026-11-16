/**
 * Pipe composition for pure stage functions.
 */
export type Stage<T> = (items: readonly T[]) => T[];

/**
 * Composes stages left-to-right.
 */
export function pipe<T>(...stages: Stage<T>[]): Stage<T> {
  return (items) => stages.reduce((acc, stage) => stage(acc), [...items]);
}
