/**
 * Hello World HTTP response DTO.
 *
 * Separate from domain and future filter-result contracts, per the
 * DTO mapping convention in the architecture reference.
 */

export interface HelloResponse {
  readonly message: string;
}
