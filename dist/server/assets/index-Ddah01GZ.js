import { jsxs, jsx } from "react/jsx-runtime";
function App() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-8 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "accent-shell rise-in relative overflow-hidden rounded-[2.2rem] px-6 py-10 sm:px-10 sm:py-14", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -left-24 -top-24 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(90,122,205,0.32),transparent_66%)]" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(254,176,93,0.34),transparent_66%)]" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "island-kicker mb-3", children: "Agent-ready cloud services" }),
          /* @__PURE__ */ jsx("h1", { className: "display-title mb-5 max-w-xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl", children: "Pay-per-use cloud infrastructure for autonomous agents." }),
          /* @__PURE__ */ jsx("p", { className: "mb-8 max-w-xl text-base text-[var(--sea-ink-soft)] sm:text-lg", children: "EquiForge is a x402-powered gateway to storage and compute. Start with S3-compatible object storage, then scale into on-demand CPU and GPU workloads without custom integrations." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: "/dashboard", className: "rounded-full border border-[rgba(90,122,205,0.35)] bg-[rgba(90,122,205,0.2)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(90,122,205,0.28)]", children: "Launch Dashboard" }),
            /* @__PURE__ */ jsx("a", { href: "/mcp", className: "rounded-full border border-[rgba(254,176,93,0.45)] bg-[rgba(254,176,93,0.2)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(254,176,93,0.3)]", children: "MCP Onboarding" }),
            /* @__PURE__ */ jsx("a", { href: "/blog", className: "rounded-full border border-[rgba(43,42,42,0.3)] bg-[rgba(245,242,242,0.96)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(43,42,42,0.45)] dark:border-[rgba(245,242,242,0.28)] dark:bg-[rgba(17,17,17,0.7)] dark:text-[var(--sea-ink)] dark:hover:border-[rgba(245,242,242,0.5)]", children: "Read the Blog" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: [{
          label: "MCP-first onboarding",
          value: "Provision services through agent-native workflows."
        }, {
          label: "x402 settlement",
          value: "Usage-based payment rails baked into every call."
        }, {
          label: "S3-compatible storage",
          value: "Buckets, keys, and usage caps in minutes."
        }].map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: item.label }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm font-semibold text-[var(--sea-ink)]", children: item.value })
        ] }, item.label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [["S3-Compatible Storage", "Provision buckets, credentials, and usage caps for agents."], ["x402 Payments", "Automated settlement and metering baked into every call."], ["MCP-First Access", "Agents provision, configure, and observe services via MCP."], ["Compute Roadmap", "CPU + GPU workloads on demand, ready for future expansion."]].map(([title, desc], index) => /* @__PURE__ */ jsxs("article", { className: "island-shell feature-card rise-in rounded-2xl p-5", style: {
      animationDelay: `${index * 90 + 80}ms`
    }, children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-2 text-base font-semibold text-[var(--sea-ink)]", children: title }),
      /* @__PURE__ */ jsx("p", { className: "m-0 text-sm text-[var(--sea-ink-soft)]", children: desc })
    ] }, title)) }),
    /* @__PURE__ */ jsxs("section", { className: "mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "How it works" }),
        /* @__PURE__ */ jsx("h2", { className: "display-title mb-3 text-3xl font-bold text-[var(--sea-ink)]", children: "A single control plane for agent infrastructure." }),
        /* @__PURE__ */ jsx("p", { className: "mb-5 text-sm text-[var(--sea-ink-soft)] sm:text-base", children: "Agents talk to EquiForge via MCP. We orchestrate billing, provisioning, and access management across storage and compute providers. You get a stable API, clean usage analytics, and a consistent payment layer." }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3 text-sm", children: ["MCP discovery + auth", "Service provisioning", "Usage metering", "x402 settlement", "Audit-ready logs"].map((label) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-[var(--sea-ink-soft)]", children: label }, label)) })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Next steps" }),
        /* @__PURE__ */ jsxs("ol", { className: "m-0 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]", children: [
          /* @__PURE__ */ jsx("li", { children: "Create an EquiForge account and connect x402 payments." }),
          /* @__PURE__ */ jsx("li", { children: "Request an S3-compatible storage service via MCP." }),
          /* @__PURE__ */ jsx("li", { children: "Monitor usage, costs, and keys from the dashboard." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--sea-ink-soft)]", children: "MCP endpoints and sample payloads are available on the MCP page." })
      ] })
    ] })
  ] });
}
export {
  App as component
};
