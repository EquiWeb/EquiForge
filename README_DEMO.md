# Demo quickstart

This checklist gets EquiForge ready for local demos.

## Prereqs

- Bun installed
- Node 20+ recommended

## Run locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## MCP demo stubs

These endpoints keep in-memory demo state to simulate real provisioning flows:

- `POST /mcp/account.create`
- `POST /mcp/payment.attach`
- `POST /mcp/storage.provision`
- `GET /mcp/service.status?serviceId=...`
- `POST /mcp/keys.rotate`

## Sample requests

```bash
curl -X POST http://localhost:3000/mcp/account.create \
  -H "Content-Type: application/json" \
  -d '{"orgName":"Forge Labs","contact":"ops@forgelabs.ai"}'

curl -X POST http://localhost:3000/mcp/payment.attach \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acct_demo","profile":"x402-default","wallet":"x402://wallet/0xabc"}'

curl -X POST http://localhost:3000/mcp/storage.provision \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acct_demo","project":"agent-lab","region":"us-east-1","usageCapGb":2048,"paymentProfile":"x402-default"}'

curl "http://localhost:3000/mcp/service.status?serviceId=storage_demo"

curl -X POST http://localhost:3000/mcp/keys.rotate \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"storage_demo","reason":"rotation test"}'
```
