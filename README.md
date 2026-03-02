# EquiForge

EquiForge is a x402-powered SaaS for offering cloud services to agents, starting
with S3-compatible storage and expanding into compute. The app is built with
TanStack Start, hosted on Vercel, and designed to integrate with Convex for
backend compute.

## Local development

```bash
bun install
bun run dev
```

## Routes

- `/` — Landing page
- `/dashboard` — Service overview
- `/storage` — S3-compatible storage
- `/payments` — x402 setup
- `/mcp` — MCP endpoints + onboarding
- `/auth` — Authentication planning
- `/blog` — SEO content

## MCP endpoints (initial stubs)

- `POST /mcp/account.create`
- `POST /mcp/payment.attach`
- `POST /mcp/storage.provision`
- `GET /mcp/service.status?serviceId=...`
- `POST /mcp/keys.rotate`
