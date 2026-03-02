import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { a as allBlogs } from "./router-DjXNIQlY.js";
import "react";
function BlogIndex() {
  const postsByDate = Array.from(new Map([...allBlogs].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf()).map((post) => [post.slug, post])).values());
  const featured = postsByDate[0];
  const posts = postsByDate.slice(1);
  return /* @__PURE__ */ jsxs("main", { className: "page-wrap px-4 pb-8 pt-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("p", { className: "island-kicker mb-2", children: "Latest Dispatches" }),
      /* @__PURE__ */ jsx("h1", { className: "display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl", children: "Blog" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-sm text-[var(--sea-ink-soft)] sm:text-base", children: "Field notes on x402 payments, MCP infrastructure, and building cloud services for agentic workflows." })
    ] }),
    featured ? /* @__PURE__ */ jsxs("section", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("article", { className: "accent-shell rise-in rounded-2xl p-5 sm:p-6 lg:col-span-2", children: [
        featured.heroImage ? /* @__PURE__ */ jsx("img", { src: featured.heroImage, alt: "", className: "mb-4 h-44 w-full rounded-xl object-cover xl:h-60" }) : null,
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-2xl font-semibold text-[var(--sea-ink)]", children: /* @__PURE__ */ jsx(Link, { to: "/blog/$slug", params: {
          slug: featured.slug
        }, className: "no-underline", children: featured.title }) }),
        /* @__PURE__ */ jsx("p", { className: "mb-2 mt-3 text-base text-[var(--sea-ink-soft)]", children: featured.description }),
        /* @__PURE__ */ jsx("p", { className: "m-0 text-xs text-[var(--sea-ink-soft)]", children: new Date(featured.pubDate).toLocaleDateString() })
      ] }),
      posts.map((post, index) => /* @__PURE__ */ jsxs("article", { className: "band-shell rise-in rounded-2xl p-5 sm:last:col-span-2 lg:last:col-span-1", style: {
        animationDelay: `${index * 80 + 120}ms`
      }, children: [
        post.heroImage ? /* @__PURE__ */ jsx("img", { src: post.heroImage, alt: "", className: "mb-4 h-44 w-full rounded-xl object-cover" }) : null,
        /* @__PURE__ */ jsx("h2", { className: "m-0 text-2xl font-semibold text-[var(--sea-ink)]", children: /* @__PURE__ */ jsx(Link, { to: "/blog/$slug", params: {
          slug: post.slug
        }, className: "no-underline", children: post.title }) }),
        /* @__PURE__ */ jsx("p", { className: "mb-2 mt-2 text-sm text-[var(--sea-ink-soft)]", children: post.description }),
        /* @__PURE__ */ jsx("p", { className: "m-0 text-xs text-[var(--sea-ink-soft)]", children: new Date(post.pubDate).toLocaleDateString() })
      ] }, post.slug))
    ] }) : /* @__PURE__ */ jsx("section", { className: "band-shell rounded-2xl p-6 text-sm text-[var(--sea-ink-soft)]", children: "First EquiForge dispatch is in progress. Check back soon." })
  ] });
}
export {
  BlogIndex as component
};
