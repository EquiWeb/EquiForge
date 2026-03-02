import { jsxs, jsx } from "react/jsx-runtime";
function Payments() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Payments" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "x402-native billing and settlement." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]", children: "Keep payment flows embedded in service calls. Configure billing profiles once, and let agents pay as they provision resources." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Payment profiles" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-[var(--sea-ink-soft)]", children: "Link x402 credentials to control spending limits and routing rules." }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3", children: [{
          name: "x402-default",
          status: "Not connected",
          detail: "Attach a wallet to enable usage-based billing."
        }, {
          name: "training-budget",
          status: "Optional",
          detail: "Create a capped profile for experimentation."
        }].map((profile) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-sm font-semibold text-[var(--sea-ink)]", children: profile.name }),
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: profile.status }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm text-[var(--sea-ink-soft)]", children: profile.detail })
        ] }, profile.name)) })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Settlement flow" }),
        /* @__PURE__ */ jsxs("ol", { className: "m-0 mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]", children: [
          /* @__PURE__ */ jsx("li", { children: "Agent requests a service over MCP." }),
          /* @__PURE__ */ jsx("li", { children: "EquiForge meters usage in real time." }),
          /* @__PURE__ */ jsx("li", { children: "x402 settles payments based on consumption." }),
          /* @__PURE__ */ jsx("li", { children: "Invoices and logs sync back to your dashboard." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--sea-ink-soft)]", children: "Payment endpoints are available via MCP once your account is created." })
      ] })
    ] })
  ] });
}
export {
  Payments as component
};
