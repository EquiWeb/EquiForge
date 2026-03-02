import { jsxs, jsx } from "react/jsx-runtime";
function Auth() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Auth" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "Secure access for teams and agents." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]", children: "Choose an authentication provider and define how agents authenticate against EquiForge services." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Supported flows" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3", children: [{
          name: "Agent API keys",
          detail: "Scoped keys for MCP and service access."
        }, {
          name: "Team SSO",
          detail: "Admin console access for operators."
        }, {
          name: "Service tokens",
          detail: "Short-lived tokens for provisioning calls."
        }].map((flow) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-sm font-semibold text-[var(--sea-ink)]", children: flow.name }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm text-[var(--sea-ink-soft)]", children: flow.detail })
        ] }, flow.name)) })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Next steps" }),
        /* @__PURE__ */ jsxs("ol", { className: "m-0 mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]", children: [
          /* @__PURE__ */ jsx("li", { children: "Pick your identity provider or request a managed setup." }),
          /* @__PURE__ */ jsx("li", { children: "Define agent roles and allowed services." }),
          /* @__PURE__ */ jsx("li", { children: "Issue keys and start provisioning via MCP." })
        ] })
      ] })
    ] })
  ] });
}
export {
  Auth as component
};
