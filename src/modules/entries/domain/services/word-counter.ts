/**
 * Counts words in a title.
 * A word is a whitespace-separated token containing at least one letter or number.
 * Punctuation-only tokens do not count.
 */
export function wordCounter(title: string): number {
  return title.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;
}
