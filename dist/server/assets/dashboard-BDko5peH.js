import { jsxs, jsx } from "react/jsx-runtime";
function Dashboard() {
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Dashboard" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "Control plane for agent infrastructure." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]", children: "Track services, usage, and billing across storage and compute as you bring agents online." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Active services" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3", children: [{
          name: "S3-Compatible Storage",
          status: "Awaiting provisioning",
          meta: "Region: us-east-1 • Usage cap: 2 TB"
        }, {
          name: "Compute (CPU)",
          status: "Planned",
          meta: "Queued for beta enrollment"
        }, {
          name: "Compute (GPU)",
          status: "Planned",
          meta: "Provider selection in progress"
        }].map((service) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-sm font-semibold text-[var(--sea-ink)]", children: service.name }),
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: service.status }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-sm text-[var(--sea-ink-soft)]", children: service.meta })
        ] }, service.name)) })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-lg font-semibold text-[var(--sea-ink)]", children: "Usage snapshot" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4", children: [["Storage", "0 GB used • 0 requests"], ["Spend", "$0.00 this month"], ["Active agents", "0 connected"]].map(([title, value]) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]", children: title }),
          /* @__PURE__ */ jsx("p", { className: "m-0 mt-2 text-lg font-semibold text-[var(--sea-ink)]", children: value })
        ] }, title)) }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-[var(--sea-ink-soft)]", children: "Connect x402 payments to unlock live metering and automated settlements." })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
