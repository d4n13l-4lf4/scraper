# Hello World HTTP Contract

This is a feature-planning summary, not a second contract source. The canonical
and editable public contract remains `docs/api/openapi.yaml`.

## Operation

| Property                | Contract                         |
| ----------------------- | -------------------------------- |
| Method and path         | `GET /hello`                     |
| Request parameters/body | None                             |
| Success status          | `200`                            |
| Media type              | `application/json`               |
| Response body           | `{ "message": "Hello, world!" }` |

Add this operation to the canonical OpenAPI file and validate it before
implementing the route. Generate the readable API reference from that file at
`docs/api/generated/openapi.html`. The endpoint is temporary and is removed
when the product filtering endpoint is delivered, as specified by US-10.

The operation documents only its successful `200` response. It does not declare
an operation-specific `404`; unmatched paths continue to use the service's
general not-found behavior outside this operation contract.
