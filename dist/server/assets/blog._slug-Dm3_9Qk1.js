import { jsxs, jsx } from "react/jsx-runtime";
import { MDXContent } from "@content-collections/mdx/react";
import { R as Route } from "./router-DjXNIQlY.js";
import "@tanstack/react-router";
import "react";
function MdxCallout({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("aside", { className: "not-prose my-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4", children: [
    /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: title }),
    /* @__PURE__ */ jsx("div", { className: "text-sm leading-7 text-[var(--sea-ink-soft)]", children })
  ] });
}
function MdxMetrics({
  items
}) {
  return /* @__PURE__ */ jsx("div", { className: "not-prose my-6 grid gap-3 sm:grid-cols-3", children: items.map((item) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3",
      children: [
        /* @__PURE__ */ jsx("p", { className: "m-0 text-xs uppercase tracking-[0.12em] text-[var(--sea-ink-soft)]", children: item.label }),
        /* @__PURE__ */ jsx("p", { className: "m-0 mt-1 text-lg font-semibold text-[var(--sea-ink)]", children: item.value })
      ]
    },
    item.label
  )) });
}
function BlogPost() {
  const post = Route.useLoaderData();
  return /* @__PURE__ */ jsx("main", { className: "page-wrap px-4 pb-10 pt-10", children: /* @__PURE__ */ jsxs("article", { className: "band-shell rounded-2xl p-6 sm:p-8", children: [
    post.heroImage ? /* @__PURE__ */ jsx("img", { src: post.heroImage, alt: "", className: "mb-6 h-64 w-full rounded-2xl object-cover" }) : null,
    /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Post" }),
    /* @__PURE__ */ jsx("h1", { className: "display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl", children: post.title }),
    /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm text-[var(--sea-ink-soft)]", children: new Date(post.pubDate).toLocaleDateString() }),
    /* @__PURE__ */ jsx("div", { className: "prose prose-slate prose-headings:text-[var(--sea-ink)] prose-p:text-[var(--sea-ink-soft)] prose-li:text-[var(--sea-ink-soft)] prose-ul:text-[var(--sea-ink-soft)] prose-ol:text-[var(--sea-ink-soft)] prose-strong:text-[var(--sea-ink)] prose-a:text-[var(--lagoon-deep)] max-w-none", children: post.mdx ? /* @__PURE__ */ jsx(MDXContent, { code: post.mdx, components: {
      MdxCallout,
      MdxMetrics
    } }) : /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: {
      __html: post.html ?? ""
    } }) })
  ] }) });
}
export {
  BlogPost as component
};
