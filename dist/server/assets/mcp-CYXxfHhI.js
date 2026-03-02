import { jsxs, jsx } from "react/jsx-runtime";
function McpPage() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "MCP" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "MCP-first provisioning and support." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]", children: "Agents discover EquiForge, authenticate, and request services through MCP endpoints. This is the primary interface for onboarding." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 lg:grid-cols-[1.15fr_0.85fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Core endpoints" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3", children: [{
          name: "mcp.account.create",
          description: "Create a new EquiForge account for an agent org."
        }, {
          name: "mcp.payment.attach",
          description: "Bind x402 payment credentials to the account."
        }, {
          name: "mcp.storage.provision",
          description: "Provision S3-compatible storage with quotas."
        }, {
          name: "mcp.service.status",
          description: "Fetch provisioning state and usage metrics."
        }, {
          name: "mcp.keys.rotate",
          description: "Rotate access keys for storage services."
        }].map((endpoint) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-sm font-semibold text-[var(--sea-ink)]", children: endpoint.name }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm text-[var(--sea-ink-soft)]", children: endpoint.description })
        ] }, endpoint.name)) })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Example handshake" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-[var(--sea-ink-soft)]", children: "Start with account creation, then attach payments before provisioning storage." }),
        /* @__PURE__ */ jsx("pre", { className: "mt-4 overflow-x-auto text-xs text-[var(--sea-ink)]", children: /* @__PURE__ */ jsx("code", { children: `POST /mcp/account.create
{
  "orgName": "Forge Labs",
  "contact": "ops@forgelabs.ai"
}

POST /mcp/payment.attach
{
  "profile": "x402-default",
  "wallet": "x402://wallet/0xabc..."
}` }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--sea-ink-soft)]", children: "MCP endpoints will return service IDs and status tokens for tracking." })
      ] })
    ] })
  ] });
}
export {
  McpPage as component
};
