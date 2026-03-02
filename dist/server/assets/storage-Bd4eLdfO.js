import { jsxs, jsx } from "react/jsx-runtime";
function Storage() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Storage" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "S3-compatible storage for agents." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]", children: "Provision buckets, generate credentials, and set usage guardrails for autonomous systems." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 lg:grid-cols-[1.2fr_0.8fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Provision a storage service" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-[var(--sea-ink-soft)]", children: "Use MCP to request a bucket, region, and budget. We create credentials and meter usage with x402." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: "Sample MCP request" }),
          /* @__PURE__ */ jsx("pre", { className: "m-0 mt-3 overflow-x-auto text-xs text-[var(--sea-ink)]", children: /* @__PURE__ */ jsx("code", { children: `POST /mcp/storage.provision
{
  "project": "agent-lab",
  "region": "us-east-1",
  "usageCapGb": 2048,
  "paymentProfile": "x402-default"
}` }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Access details" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: [["Endpoint", "https://storage.equiforge.com"], ["Access key", "Issued after provisioning"], ["Secret", "Stored in your agent vault"], ["Usage caps", "Enforced at the edge"]].map(([label, value]) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: label }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm font-semibold text-[var(--sea-ink)]", children: value })
        ] }, label)) })
      ] })
    ] })
  ] });
}
export {
  Storage as component
};
