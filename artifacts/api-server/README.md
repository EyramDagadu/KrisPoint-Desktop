# KrisPoint AI gateway

This is the only service that may hold an AI provider credential. It exposes
`GET /health` and `POST /v1/polish`, and must be deployed behind TLS (the
default listener is loopback unless the deployment sets `HOST`). The gateway
never logs request bodies, prompts, reports, or provider responses.

Required production settings:

* `KRISPOINT_LICENSE_PUBLIC_KEY` — pinned Ed25519 public key (PEM, base64
  SPKI, or base64 raw 32-byte key).
* `KRISPOINT_LICENSE_SERVER_URL` — license server used for metadata-only
  revocation checks.
* `GROQ_API_KEY` — server-only Groq credential.

`AI_PROVIDER` currently supports only `groq` (the default) and
`GROQ_MODEL` defaults to `openai/gpt-oss-120b`. An unsupported provider
fails closed. `HOST`, `PORT`, `GATEWAY_ALLOWED_ORIGINS`,
`AI_MAX_CONCURRENT`, and `AI_RATE_LIMIT` may be set by the deployment.
`POST /v1/polish` accepts `action=polish|impression`; both return the same
structured JSON contract, while impression safety permits a concise derived
summary without requiring every source sentence to be repeated.

The SvelteKit Solo server proxies its authenticated, same-origin request to
this service. It does not receive or forward the provider credential. Solo
does not need the local SvelteKit process to have the license public key or
license-server URL: the gateway is authoritative for the signed entitlement.
The gateway sends exactly `licenseKey`, `machineId`, `payload`, and
`signature` to the license authority; report/template content is never part of
that DTO.

The signed Ed25519 license envelope is the server-to-server entitlement. Origin
and Fetch Metadata checks reject ordinary browser cross-site requests as
defense in depth; they do not authenticate a backend caller. After signature
and authority validation, rate limits are keyed by verified
`licenseKey:machineId`, rather than only by source IP.

Solo deployments should set `KRISPOINT_REMOTE_AI_ENABLED=true`; setting it to
`false` disables remote AI. Solo blocks explicit patient names, medical
record/hospital/accession numbers, email addresses, and phone numbers by
default before any network request; `KRISPOINT_AI_ALLOW_IDENTIFIERS=true` is
an explicit deployment opt-in. The gateway repeats this policy for direct
originless requests.

In Hospital mode, `providerMode=hosted` uses the managed server provider.
`providerMode=byo` uses only the SvelteKit server's OpenAI-compatible adapter
and requires server-only `BYO_AI_BASE_URL`, `BYO_AI_API_KEY`, and
`BYO_AI_MODEL` (HTTPS is required in production). Solo rejects BYO and can
only proxy hosted requests to this gateway. The browser never selects a
provider destination directly.

## Replit autoscale deployment

When deploying this directory as the Replit project root, use the checked-in
`replit-deploy.toml` configuration. It runs `HOST=0.0.0.0 node src/server.mjs`;
the server reads Replit's `$PORT`. Production must set
`KRISPOINT_LICENSE_PUBLIC_KEY`, `KRISPOINT_LICENSE_SERVER_URL` (HTTPS),
`GROQ_API_KEY`, and `AI_PROVIDER=groq`. The deployment must also set
`GROQ_MODEL` as desired, `GATEWAY_ALLOWED_ORIGINS` if browser-origin defense
is needed, and the rate limits. No credentials are committed or published by
this repository.