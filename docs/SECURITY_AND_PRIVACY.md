# Security and privacy

## Public source versus live deployment

Publishing source code does not approve hosting a public finance service. A live deployment would process account identifiers, email addresses, financial values, and descriptions and therefore requires a separate privacy, abuse, operational, and legal review.

## Current safeguards

- bcrypt password hashing
- Auth.js HTTP-only session handling
- user and group resource filters
- explicit owner checks for owner-only group actions
- Zod request validation
- development authentication disabled by default and refused in production
- production startup validation for database URL, HTTPS Auth.js URL, and a non-placeholder secret
- PostgreSQL kept on the internal Compose network
- the optional development override exposes PostgreSQL on loopback only
- synthetic seed requires non-production mode and `ALLOW_SYNTHETIC_SEED=true`

## Known limitations

- registration is open
- no email verification, recovery flow, or login rate limiting
- no multi-factor authentication
- no account deletion or data export workflow
- no formal audit log or retention policy
- access logs may contain request paths, status codes, timestamps, IP metadata, and user-agent metadata depending on the reverse proxy
- a reverse proxy must provide HTTPS, request limits, trusted-host policy, and secure operational logging for any deployment

No real user or financial data is bundled. Avoid putting financial payloads, credentials, database dumps, exports, or `.env` files in issues or commits.
