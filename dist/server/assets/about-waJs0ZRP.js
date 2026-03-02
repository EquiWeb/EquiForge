import { jsx, jsxs } from "react/jsx-runtime";
function About() {
  return /* @__PURE__ */ jsx("main", { className: "page-wrap px-4 py-8", children: /* @__PURE__ */ jsxs("section", { className: "band-shell rounded-2xl p-6 sm:p-8", children: [
    /* @__PURE__ */ jsx("img", { src: "/images/lagoon-about.svg", alt: "", className: "mb-6 h-56 w-full rounded-2xl object-cover" }),
    /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "About" }),
    /* @__PURE__ */ jsx("h1", { className: "display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl", children: "EquiForge is the control plane for agent infrastructure." }),
    /* @__PURE__ */ jsx("p", { className: "m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]", children: "We are building a x402-native SaaS that helps agents discover, pay for, and operate cloud services. Storage launches first, then compute, with MCP as the primary interface for provisioning and operations." })
  ] }) });
}
export {
  About as component
};
