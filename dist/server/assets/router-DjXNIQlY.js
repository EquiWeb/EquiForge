import { Link, createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, notFound, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
function Footer() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return /* @__PURE__ */ jsxs("footer", { className: "mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left", children: [
      /* @__PURE__ */ jsxs("p", { className: "m-0 text-sm", children: [
        "© ",
        year,
        " EquiForge. All rights reserved."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "island-kicker m-0", children: "x402-ready cloud services" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-center gap-4", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://x.com/equiforge",
          target: "_blank",
          rel: "noreferrer",
          className: "rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]",
          children: [
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Follow EquiForge on X" }),
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", width: "32", height: "32", children: /* @__PURE__ */ jsx(
              "path",
              {
                fill: "currentColor",
                d: "M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://github.com/EquiForge",
          target: "_blank",
          rel: "noreferrer",
          className: "rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]",
          children: [
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Go to EquiForge GitHub" }),
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", width: "32", height: "32", children: /* @__PURE__ */ jsx(
              "path",
              {
                fill: "currentColor",
                d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              }
            ) })
          ]
        }
      )
    ] })
  ] });
}
function getInitialMode() {
  if (typeof window === "undefined") {
    return "auto";
  }
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
}
function applyThemeMode(mode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? prefersDark ? "dark" : "light" : mode;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  document.documentElement.style.colorScheme = resolved;
}
function ThemeToggle() {
  const [mode, setMode] = useState("auto");
  useEffect(() => {
    const initialMode = getInitialMode();
    setMode(initialMode);
    applyThemeMode(initialMode);
  }, []);
  useEffect(() => {
    if (mode !== "auto") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("auto");
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);
  function toggleMode() {
    const nextMode = mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
    setMode(nextMode);
    applyThemeMode(nextMode);
    window.localStorage.setItem("theme", nextMode);
  }
  const label = mode === "auto" ? "Theme mode: auto (system). Click to switch to light mode." : `Theme mode: ${mode}. Click to switch mode.`;
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: toggleMode,
      "aria-label": label,
      title: label,
      className: "rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5",
      children: mode === "auto" ? "Auto" : mode === "dark" ? "Dark" : "Light"
    }
  );
}
function Header() {
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg", children: /* @__PURE__ */ jsxs("nav", { className: "page-wrap flex flex-wrap items-center gap-x-2 gap-y-1.5 py-3 sm:gap-x-3 sm:gap-y-2 sm:py-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "m-0 flex-shrink-0 text-base font-semibold tracking-tight", children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/",
        className: "inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2",
        children: [
          /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-[linear-gradient(90deg,var(--lagoon),var(--palm))]" }),
          /* @__PURE__ */ jsx(
            "img",
            {
              src: "/image.webp",
              alt: "EquiForge",
              className: "logo-mark h-5 w-auto object-contain sm:h-6"
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://x.com/equiforge",
          target: "_blank",
          rel: "noreferrer",
          className: "hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block",
          children: [
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Follow EquiForge on X" }),
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", width: "24", height: "24", children: /* @__PURE__ */ jsx(
              "path",
              {
                fill: "currentColor",
                d: "M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://github.com/EquiForge",
          target: "_blank",
          rel: "noreferrer",
          className: "hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block",
          children: [
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Go to EquiForge GitHub" }),
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", width: "24", height: "24", children: /* @__PURE__ */ jsx(
              "path",
              {
                fill: "currentColor",
                d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsx(ThemeToggle, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "nav-link",
          activeProps: { className: "nav-link is-active" },
          children: "Home"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/auth",
          className: "nav-link hidden sm:inline-flex",
          activeProps: { className: "nav-link is-active" },
          children: "Auth"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/dashboard",
          className: "nav-link sm:hidden",
          activeProps: { className: "nav-link is-active" },
          children: "Dashboard"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/blog",
          className: "nav-link",
          activeProps: { className: "nav-link is-active" },
          children: "Blog"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/storage",
          className: "nav-link hidden sm:inline-flex",
          activeProps: { className: "nav-link is-active" },
          children: "Storage"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/payments",
          className: "nav-link hidden sm:inline-flex",
          activeProps: { className: "nav-link is-active" },
          children: "Payments"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/mcp",
          className: "nav-link hidden sm:inline-flex",
          activeProps: { className: "nav-link is-active" },
          children: "MCP"
        }
      )
    ] })
  ] }) });
}
const appCss = "/assets/styles-BJhkmxbQ.css";
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;
const Route$f = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "EquiForge"
      },
      {
        name: "description",
        content: "EquiForge is a x402-powered cloud services hub for agents, starting with S3-compatible storage and expanding into compute."
      },
      {
        property: "og:title",
        content: "EquiForge"
      },
      {
        property: "og:description",
        content: "EquiForge is a x402-powered cloud services hub for agents, starting with S3-compatible storage and expanding into compute."
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "icon",
        href: "/favicon.ico"
      },
      {
        rel: "manifest",
        href: "/manifest.json"
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: THEME_INIT_SCRIPT } }),
      /* @__PURE__ */ jsx(HeadContent, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { className: "font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]", children: [
      /* @__PURE__ */ jsx(Header, {}),
      children,
      /* @__PURE__ */ jsx(Footer, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$8 = () => import("./storage-Bd4eLdfO.js");
const Route$e = createFileRoute("/storage")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const allBlogs = [
  {
    "title": "Velvet Runtime Notes",
    "description": "Use color tokens to keep light and dark themes aligned.",
    "pubDate": "2024-08-04T23:00:00.000Z",
    "content": "Semantic tokens keep your UI stable while the brand evolves.\n\nInstead of hard-coding one-off colors in components, shape a small set of\nvariables and map all surfaces to those variables.\n\n## Why this matters\n\n- You can restyle the app in minutes instead of days\n- Light and dark themes stay behaviorally consistent\n- Add-on pages inherit your visual identity by default\n\n<MdxCallout title=\"MDX Component Demo\">\n  This callout is rendered from JSX inside an MDX post. It is useful for\n  release notes, warnings, and migration tips where you want stronger visual\n  emphasis than plain markdown blocks.\n</MdxCallout>\n\n<MdxMetrics\n  items={[\n    { label: 'Token count', value: '12 core vars' },\n    { label: 'Theme modes', value: 'light + dark + auto' },\n    { label: 'Restyle time', value: '< 30 min' },\n  ]}\n/>\n\n### Token-to-component mapping\n\n| Token | Typical usage |\n| --- | --- |\n| `--surface` | Card backgrounds |\n| `--line` | Borders and separators |\n| `--lagoon-deep` | Links and active nav |\n\nKeep the mapping documented and your team will make fewer ad-hoc styling calls.\n\n### Example: deriving UI from semantic tokens\n\n```tsx\nconst button = {\n  color: 'var(--sea-ink)',\n  background: 'var(--surface)',\n  borderColor: 'var(--line)',\n}\n```\n\nMDX is useful here because you can interleave narrative, tables, code blocks,\nand custom JSX components in one authoring surface.",
    "heroImage": "/images/lagoon-5.svg",
    "_meta": {
      "filePath": "fifth-post.mdx",
      "fileName": "fifth-post.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "fifth-post"
    },
    "slug": "fifth-post",
    "html": null,
    "mdx": 'var Component=(()=>{var m=Object.create;var o=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var b=Object.getPrototypeOf,g=Object.prototype.hasOwnProperty;var y=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),v=(t,e)=>{for(var r in e)o(t,r,{get:e[r],enumerable:!0})},l=(t,e,r,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of f(e))!g.call(t,a)&&a!==r&&o(t,a,{get:()=>e[a],enumerable:!(i=p(e,a))||i.enumerable});return t};var k=(t,e,r)=>(r=t!=null?m(b(t)):{},l(e||!t||!t.__esModule?o(r,"default",{value:t,enumerable:!0}):r,t)),x=t=>l(o({},"__esModule",{value:!0}),t);var s=y((_,d)=>{d.exports=_jsx_runtime});var M={};v(M,{default:()=>u});var n=k(s());function c(t){let e={code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...t.components},{MdxCallout:r,MdxMetrics:i}=e;return r||h("MdxCallout",!0),i||h("MdxMetrics",!0),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(e.p,{children:"Semantic tokens keep your UI stable while the brand evolves."}),`\n`,(0,n.jsx)(e.p,{children:`Instead of hard-coding one-off colors in components, shape a small set of\nvariables and map all surfaces to those variables.`}),`\n`,(0,n.jsx)(e.h2,{children:"Why this matters"}),`\n`,(0,n.jsxs)(e.ul,{children:[`\n`,(0,n.jsx)(e.li,{children:"You can restyle the app in minutes instead of days"}),`\n`,(0,n.jsx)(e.li,{children:"Light and dark themes stay behaviorally consistent"}),`\n`,(0,n.jsx)(e.li,{children:"Add-on pages inherit your visual identity by default"}),`\n`]}),`\n`,(0,n.jsx)(r,{title:"MDX Component Demo",children:(0,n.jsx)(e.p,{children:`This callout is rendered from JSX inside an MDX post. It is useful for\nrelease notes, warnings, and migration tips where you want stronger visual\nemphasis than plain markdown blocks.`})}),`\n`,(0,n.jsx)(i,{items:[{label:"Token count",value:"12 core vars"},{label:"Theme modes",value:"light + dark + auto"},{label:"Restyle time",value:"< 30 min"}]}),`\n`,(0,n.jsx)(e.h3,{children:"Token-to-component mapping"}),`\n`,(0,n.jsxs)(e.table,{children:[(0,n.jsx)(e.thead,{children:(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.th,{children:"Token"}),(0,n.jsx)(e.th,{children:"Typical usage"})]})}),(0,n.jsxs)(e.tbody,{children:[(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.td,{children:(0,n.jsx)(e.code,{children:"--surface"})}),(0,n.jsx)(e.td,{children:"Card backgrounds"})]}),(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.td,{children:(0,n.jsx)(e.code,{children:"--line"})}),(0,n.jsx)(e.td,{children:"Borders and separators"})]}),(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.td,{children:(0,n.jsx)(e.code,{children:"--lagoon-deep"})}),(0,n.jsx)(e.td,{children:"Links and active nav"})]})]})]}),`\n`,(0,n.jsx)(e.p,{children:"Keep the mapping documented and your team will make fewer ad-hoc styling calls."}),`\n`,(0,n.jsx)(e.h3,{children:"Example: deriving UI from semantic tokens"}),`\n`,(0,n.jsx)(e.pre,{children:(0,n.jsx)(e.code,{className:"language-tsx",children:`const button = {\n  color: \'var(--sea-ink)\',\n  background: \'var(--surface)\',\n  borderColor: \'var(--line)\',\n}\n`})}),`\n`,(0,n.jsx)(e.p,{children:`MDX is useful here because you can interleave narrative, tables, code blocks,\nand custom JSX components in one authoring surface.`})]})}function u(t={}){let{wrapper:e}=t.components||{};return e?(0,n.jsx)(e,{...t,children:(0,n.jsx)(c,{...t})}):c(t)}function h(t,e){throw new Error("Expected "+(e?"component":"object")+" `"+t+"` to be defined: you likely forgot to import, pass, or provide it.")}return x(M);})();\n;return Component;'
  },
  {
    "title": "Neon Mango Protocol",
    "description": "A quick walkthrough of the starter foundations.",
    "pubDate": "2024-07-07T23:00:00.000Z",
    "content": "This starter ships with routes, SSR, and a calm visual system out of the box.\n\nStart by editing route files, then layer in add-ons as needed.\n\n## What you get on day one\n\n- Full-document SSR using TanStack Start\n- Type-safe file routing with generated route types\n- A reusable design token system for light and dark themes\n\nThe goal is simple: let teams ship product pages and APIs without spending the\nfirst week wiring framework internals.\n\n### Suggested order of operations\n\n1. Make the home route feel like your product\n2. Add one feature route and one API route\n3. Introduce add-ons only after your core UX is clear\n\n> Keep the first commit boring. Reliable defaults beat clever setup code.\n\n## Baseline delivery checklist\n\nBefore introducing custom infra, confirm these are green:\n\n- `pnpm dev` starts cleanly\n- one server route returns typed data\n- one API route validates input/output\n- one integration test exercises a full page render\n\nWhen these are in place, you can iterate quickly without losing confidence.\n\n### Example request flow\n\n1. Client navigation enters route loader\n2. Loader calls server function\n3. Server function reads data source and returns typed payload\n4. Route component renders immediately with stable shape\n\nThat flow is simple, predictable, and easy to debug.",
    "heroImage": "/images/lagoon-3.svg",
    "_meta": {
      "filePath": "first-post.md",
      "fileName": "first-post.md",
      "directory": ".",
      "extension": "md",
      "path": "first-post"
    },
    "slug": "first-post",
    "html": "<p>This starter ships with routes, SSR, and a calm visual system out of the box.</p>\n<p>Start by editing route files, then layer in add-ons as needed.</p>\n<h2>What you get on day one</h2>\n<ul>\n<li>Full-document SSR using TanStack Start</li>\n<li>Type-safe file routing with generated route types</li>\n<li>A reusable design token system for light and dark themes</li>\n</ul>\n<p>The goal is simple: let teams ship product pages and APIs without spending the\nfirst week wiring framework internals.</p>\n<h3>Suggested order of operations</h3>\n<ol>\n<li>Make the home route feel like your product</li>\n<li>Add one feature route and one API route</li>\n<li>Introduce add-ons only after your core UX is clear</li>\n</ol>\n<blockquote>\n<p>Keep the first commit boring. Reliable defaults beat clever setup code.</p>\n</blockquote>\n<h2>Baseline delivery checklist</h2>\n<p>Before introducing custom infra, confirm these are green:</p>\n<ul>\n<li><code>pnpm dev</code> starts cleanly</li>\n<li>one server route returns typed data</li>\n<li>one API route validates input/output</li>\n<li>one integration test exercises a full page render</li>\n</ul>\n<p>When these are in place, you can iterate quickly without losing confidence.</p>\n<h3>Example request flow</h3>\n<ol>\n<li>Client navigation enters route loader</li>\n<li>Loader calls server function</li>\n<li>Server function reads data source and returns typed payload</li>\n<li>Route component renders immediately with stable shape</li>\n</ol>\n<p>That flow is simple, predictable, and easy to debug.</p>",
    "mdx": null
  },
  {
    "title": "Static Tide Almanac",
    "description": "Dial in layout polish and image rhythm across cards.",
    "pubDate": "2024-07-28T23:00:00.000Z",
    "content": "As your app grows, visual rhythm matters as much as feature scope.\n\nUse larger feature cards to call attention to primary content, then support with\nsmaller cards for secondary updates.\n\n## Practical layout pattern\n\nUse one featured card followed by standard cards in a responsive grid:\n\n- `lg:col-span-2` for the featured story\n- regular span for supporting posts\n- consistent card media height below `lg`\n\nThat gives you hierarchy without reinventing every breakpoint.\n\n### A quick spacing rule\n\nPair spacing in steps of 4 (`p-4`, `p-8`, `gap-4`, `gap-8`) and only break that\nrule for hero sections.\n\n## Card hierarchy recipe\n\nFor content-heavy indexes, this sequence works well:\n\n1. One featured card with expanded width\n2. Three to six standard cards for breadth\n3. Optional utility card for onboarding links\n\nKeep title sizes mostly consistent and let width + image treatment carry\nhierarchy. That avoids jarring jumps as breakpoints shift.\n\n### Avoiding layout drift\n\nIf cards start to look uneven, check image heights first, then paragraph length.\nConsistency there usually fixes 80% of visual noise.",
    "heroImage": "/images/lagoon-1.svg",
    "_meta": {
      "filePath": "fourth-post.md",
      "fileName": "fourth-post.md",
      "directory": ".",
      "extension": "md",
      "path": "fourth-post"
    },
    "slug": "fourth-post",
    "html": "<p>As your app grows, visual rhythm matters as much as feature scope.</p>\n<p>Use larger feature cards to call attention to primary content, then support with\nsmaller cards for secondary updates.</p>\n<h2>Practical layout pattern</h2>\n<p>Use one featured card followed by standard cards in a responsive grid:</p>\n<ul>\n<li><code>lg:col-span-2</code> for the featured story</li>\n<li>regular span for supporting posts</li>\n<li>consistent card media height below <code>lg</code></li>\n</ul>\n<p>That gives you hierarchy without reinventing every breakpoint.</p>\n<h3>A quick spacing rule</h3>\n<p>Pair spacing in steps of 4 (<code>p-4</code>, <code>p-8</code>, <code>gap-4</code>, <code>gap-8</code>) and only break that\nrule for hero sections.</p>\n<h2>Card hierarchy recipe</h2>\n<p>For content-heavy indexes, this sequence works well:</p>\n<ol>\n<li>One featured card with expanded width</li>\n<li>Three to six standard cards for breadth</li>\n<li>Optional utility card for onboarding links</li>\n</ol>\n<p>Keep title sizes mostly consistent and let width + image treatment carry\nhierarchy. That avoids jarring jumps as breakpoints shift.</p>\n<h3>Avoiding layout drift</h3>\n<p>If cards start to look uneven, check image heights first, then paragraph length.\nConsistency there usually fixes 80% of visual noise.</p>",
    "mdx": null
  },
  {
    "title": "Paper Lantern Cache",
    "description": "How to shape navigation and page structure.",
    "pubDate": "2024-07-14T23:00:00.000Z",
    "content": "Use file-based routes in `src/routes` to grow the app.\n\nKeep shared UI in `src/components` and tune visual tokens in `src/styles.css`.\n\n## Route design tips\n\nTreat routes like product domains, not technical buckets.\n\n- `routes/settings.*` for account surfaces\n- `routes/billing.*` for payment and plan logic\n- `routes/api.*` for server handlers that belong to the same domain\n\nWhen route trees map to business intent, onboarding gets faster and refactors\nhurt less.\n\n```tsx\n// src/routes/billing.index.tsx\nexport const Route = createFileRoute('/billing/')({\n  component: BillingPage,\n})\n```\n\n<MdxMetrics\n  items={[\n    { label: 'Route setup', value: '~10 min' },\n    { label: 'Type safety', value: 'end-to-end' },\n    { label: 'Refactor risk', value: 'lowered' },\n  ]}\n/>\n\n### Collaboration pattern\n\nUse this lightweight ownership split:\n\n1. Product owns route naming and URL intent\n2. Design owns shared layout primitives and tokens\n3. Engineering owns loaders, actions, and caching\n\nThis pattern keeps URL design, data loading, and UI composition in one place.",
    "heroImage": "/images/lagoon-4.svg",
    "_meta": {
      "filePath": "second-post.mdx",
      "fileName": "second-post.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "second-post"
    },
    "slug": "second-post",
    "html": null,
    "mdx": 'var Component=(()=>{var u=Object.create;var r=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var m=Object.getPrototypeOf,f=Object.prototype.hasOwnProperty;var x=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),b=(t,e)=>{for(var i in e)r(t,i,{get:e[i],enumerable:!0})},l=(t,e,i,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of g(e))!f.call(t,o)&&o!==i&&r(t,o,{get:()=>e[o],enumerable:!(s=p(e,o))||s.enumerable});return t};var w=(t,e,i)=>(i=t!=null?u(m(t)):{},l(e||!t||!t.__esModule?r(i,"default",{value:t,enumerable:!0}):i,t)),y=t=>l(r({},"__esModule",{value:!0}),t);var d=x((k,c)=>{c.exports=_jsx_runtime});var R={};b(R,{default:()=>h});var n=w(d());function a(t){let e={code:"code",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...t.components},{MdxMetrics:i}=e;return i||M("MdxMetrics",!0),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(e.p,{children:["Use file-based routes in ",(0,n.jsx)(e.code,{children:"src/routes"})," to grow the app."]}),`\n`,(0,n.jsxs)(e.p,{children:["Keep shared UI in ",(0,n.jsx)(e.code,{children:"src/components"})," and tune visual tokens in ",(0,n.jsx)(e.code,{children:"src/styles.css"}),"."]}),`\n`,(0,n.jsx)(e.h2,{children:"Route design tips"}),`\n`,(0,n.jsx)(e.p,{children:"Treat routes like product domains, not technical buckets."}),`\n`,(0,n.jsxs)(e.ul,{children:[`\n`,(0,n.jsxs)(e.li,{children:[(0,n.jsx)(e.code,{children:"routes/settings.*"})," for account surfaces"]}),`\n`,(0,n.jsxs)(e.li,{children:[(0,n.jsx)(e.code,{children:"routes/billing.*"})," for payment and plan logic"]}),`\n`,(0,n.jsxs)(e.li,{children:[(0,n.jsx)(e.code,{children:"routes/api.*"})," for server handlers that belong to the same domain"]}),`\n`]}),`\n`,(0,n.jsx)(e.p,{children:`When route trees map to business intent, onboarding gets faster and refactors\nhurt less.`}),`\n`,(0,n.jsx)(e.pre,{children:(0,n.jsx)(e.code,{className:"language-tsx",children:`// src/routes/billing.index.tsx\nexport const Route = createFileRoute(\'/billing/\')({\n  component: BillingPage,\n})\n`})}),`\n`,(0,n.jsx)(i,{items:[{label:"Route setup",value:"~10 min"},{label:"Type safety",value:"end-to-end"},{label:"Refactor risk",value:"lowered"}]}),`\n`,(0,n.jsx)(e.h3,{children:"Collaboration pattern"}),`\n`,(0,n.jsx)(e.p,{children:"Use this lightweight ownership split:"}),`\n`,(0,n.jsxs)(e.ol,{children:[`\n`,(0,n.jsx)(e.li,{children:"Product owns route naming and URL intent"}),`\n`,(0,n.jsx)(e.li,{children:"Design owns shared layout primitives and tokens"}),`\n`,(0,n.jsx)(e.li,{children:"Engineering owns loaders, actions, and caching"}),`\n`]}),`\n`,(0,n.jsx)(e.p,{children:"This pattern keeps URL design, data loading, and UI composition in one place."})]})}function h(t={}){let{wrapper:e}=t.components||{};return e?(0,n.jsx)(e,{...t,children:(0,n.jsx)(a,{...t})}):a(t)}function M(t,e){throw new Error("Expected "+(e?"component":"object")+" `"+t+"` to be defined: you likely forgot to import, pass, or provide it.")}return y(R);})();\n;return Component;'
  },
  {
    "title": "Midnight Compass Build",
    "description": "Where to customize theme and typography.",
    "pubDate": "2024-07-21T23:00:00.000Z",
    "content": "Update CSS variables in `src/styles.css` to fit your brand.\n\nThen adjust header and footer links to match your product.\n\n## Theme alignment checklist\n\nBefore adding one-off colors, audit these variables:\n\n- `--sea-ink` and `--sea-ink-soft` for readable body copy\n- `--surface` and `--surface-strong` for cards and shells\n- `--lagoon` / `--lagoon-deep` for links and active UI affordances\n\nIf those are correct, most components will look coherent with zero extra work.\n\n### Accessibility reminder\n\nCheck contrast on at least three surfaces:\n\n1. page background\n2. primary card\n3. muted card\n\nYou can be highly branded and still hit comfortable readability.\n\n## Typography defaults that travel well\n\nUse a high-contrast display face for headlines and a workhorse sans for body\ncopy. Then lock in a spacing scale that keeps article rhythm consistent:\n\n- headings: `mt-10 mb-3`\n- paragraphs: `mb-5`\n- lists: `mb-6`\n\nWith those defaults set, long-form pages stay readable across both themes.\n\n### Practical review loop\n\nWhen you tweak tokens, review these pages in order:\n\n1. Blog detail page (most typography states)\n2. Blog index page (cards + metadata)\n3. Home page (hero and CTA emphasis)",
    "heroImage": "/images/lagoon-2.svg",
    "_meta": {
      "filePath": "third-post.md",
      "fileName": "third-post.md",
      "directory": ".",
      "extension": "md",
      "path": "third-post"
    },
    "slug": "third-post",
    "html": "<p>Update CSS variables in <code>src/styles.css</code> to fit your brand.</p>\n<p>Then adjust header and footer links to match your product.</p>\n<h2>Theme alignment checklist</h2>\n<p>Before adding one-off colors, audit these variables:</p>\n<ul>\n<li><code>--sea-ink</code> and <code>--sea-ink-soft</code> for readable body copy</li>\n<li><code>--surface</code> and <code>--surface-strong</code> for cards and shells</li>\n<li><code>--lagoon</code> / <code>--lagoon-deep</code> for links and active UI affordances</li>\n</ul>\n<p>If those are correct, most components will look coherent with zero extra work.</p>\n<h3>Accessibility reminder</h3>\n<p>Check contrast on at least three surfaces:</p>\n<ol>\n<li>page background</li>\n<li>primary card</li>\n<li>muted card</li>\n</ol>\n<p>You can be highly branded and still hit comfortable readability.</p>\n<h2>Typography defaults that travel well</h2>\n<p>Use a high-contrast display face for headlines and a workhorse sans for body\ncopy. Then lock in a spacing scale that keeps article rhythm consistent:</p>\n<ul>\n<li>headings: <code>mt-10 mb-3</code></li>\n<li>paragraphs: <code>mb-5</code></li>\n<li>lists: <code>mb-6</code></li>\n</ul>\n<p>With those defaults set, long-form pages stay readable across both themes.</p>\n<h3>Practical review loop</h3>\n<p>When you tweak tokens, review these pages in order:</p>\n<ol>\n<li>Blog detail page (most typography states)</li>\n<li>Blog index page (cards + metadata)</li>\n<li>Home page (hero and CTA emphasis)</li>\n</ol>",
    "mdx": null
  }
];
const SITE_TITLE = "EquiForge";
const SITE_DESCRIPTION = "EquiForge is a x402-powered cloud services hub for agents, starting with S3-compatible storage and expanding into compute.";
const SITE_URL = "https://equiforge.com";
const Route$d = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: () => {
        const posts = Array.from(
          new Map(
            [...allBlogs].sort(
              (a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf()
            ).map((post) => [post.slug, post])
          ).values()
        );
        const items = posts.map((post) => {
          const url = `${SITE_URL}/blog/${post.slug}`;
          return `<item><title><![CDATA[${post.title}]]></title><description><![CDATA[${post.description}]]></description><link>${url}</link><guid>${url}</guid><pubDate>${new Date(post.pubDate).toUTCString()}</pubDate></item>`;
        }).join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[${SITE_TITLE}]]></title><description><![CDATA[${SITE_DESCRIPTION}]]></description><link>${SITE_URL}</link>${items}</channel></rss>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter$7 = () => import("./payments-CUnB4Zzd.js");
const Route$c = createFileRoute("/payments")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./mcp-CYXxfHhI.js");
const Route$b = createFileRoute("/mcp")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard-BDko5peH.js");
const Route$a = createFileRoute("/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./auth-CwBN0bwI.js");
const Route$9 = createFileRoute("/auth")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./about-waJs0ZRP.js");
const Route$8 = createFileRoute("/about")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./index-Ddah01GZ.js");
const Route$7 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "EquiForge — Agent-ready cloud services"
    }, {
      name: "description",
      content: "x402-powered cloud services for agents. Start with S3-compatible storage and expand into on-demand compute."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./blog.index-DhM38VHp.js");
const canonical = `${SITE_URL}/blog`;
const pageTitle = `Blog | ${SITE_TITLE}`;
const Route$6 = createFileRoute("/blog/")({
  head: () => ({
    links: [{
      rel: "canonical",
      href: canonical
    }],
    meta: [{
      title: pageTitle
    }, {
      name: "description",
      content: SITE_DESCRIPTION
    }, {
      property: "og:image",
      content: `${SITE_URL}/images/lagoon-1.svg`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./blog._slug-Dm3_9Qk1.js");
const Route$5 = createFileRoute("/blog/$slug")({
  loader: ({
    params
  }) => {
    const post = Array.from(new Map([...allBlogs].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf()).map((entry) => [entry.slug, entry])).values()).find((entry) => entry.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({
    loaderData,
    params
  }) => {
    const title = loaderData?.title ?? "Post";
    const description = loaderData?.description ?? "";
    const image = loaderData?.heroImage ?? "/images/lagoon-1.svg";
    return {
      links: [{
        rel: "canonical",
        href: `${SITE_URL}/blog/${params.slug}`
      }],
      meta: [{
        title
      }, {
        name: "description",
        content: description
      }, {
        property: "og:image",
        content: image.startsWith("http") ? image : `${SITE_URL}${image}`
      }]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const accounts = /* @__PURE__ */ new Map();
const storageServices = /* @__PURE__ */ new Map();
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}
function randomKey(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
function createAccount(input) {
  const account = {
    id: randomId("acct"),
    orgName: input.orgName,
    contact: input.contact,
    createdAt: nowIso(),
    paymentProfiles: []
  };
  accounts.set(account.id, account);
  return account;
}
function attachPaymentProfile(input) {
  const account = accounts.get(input.accountId);
  if (!account) {
    return null;
  }
  if (!account.paymentProfiles.includes(input.profile)) {
    account.paymentProfiles = [...account.paymentProfiles, input.profile];
  }
  accounts.set(account.id, account);
  return {
    accountId: account.id,
    profile: input.profile,
    wallet: input.wallet
  };
}
function createStorageService(input) {
  const account = accounts.get(input.accountId);
  if (!account) {
    return { error: "Account not found" };
  }
  if (!account.paymentProfiles.includes(input.paymentProfile)) {
    return { error: "Payment profile not attached" };
  }
  const timestamp = nowIso();
  const service = {
    id: randomId("storage"),
    accountId: input.accountId,
    project: input.project,
    region: input.region,
    usageCapGb: input.usageCapGb ?? null,
    paymentProfile: input.paymentProfile,
    status: "active",
    endpoint: "https://storage.equiforge.com",
    accessKeyId: randomKey("access"),
    secretAccessKey: randomKey("secret"),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  storageServices.set(service.id, service);
  return { service };
}
function getStorageService(serviceId) {
  return storageServices.get(serviceId) ?? null;
}
function rotateStorageKeys(serviceId, reason) {
  const service = storageServices.get(serviceId);
  if (!service) {
    return null;
  }
  const updatedAt = nowIso();
  const updated = {
    ...service,
    accessKeyId: randomKey("access"),
    secretAccessKey: randomKey("secret"),
    updatedAt
  };
  storageServices.set(serviceId, updated);
  return { service: updated, reason: reason ?? null };
}
const Route$4 = createFileRoute("/mcp/storage/provision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json();
        if (!payload.accountId || !payload.project || !payload.region || !payload.paymentProfile) {
          return Response.json(
            {
              error: "Missing accountId, project, region, or paymentProfile"
            },
            { status: 400 }
          );
        }
        const result = createStorageService({
          accountId: payload.accountId,
          project: payload.project,
          region: payload.region,
          usageCapGb: payload.usageCapGb,
          paymentProfile: payload.paymentProfile
        });
        if ("error" in result) {
          return Response.json(
            {
              error: result.error
            },
            { status: 400 }
          );
        }
        return Response.json({
          serviceId: result.service.id,
          status: result.service.status,
          region: result.service.region,
          project: result.service.project,
          usageCapGb: result.service.usageCapGb,
          paymentProfile: result.service.paymentProfile,
          endpoint: result.service.endpoint,
          accessKeyId: result.service.accessKeyId,
          secretAccessKey: result.service.secretAccessKey,
          createdAt: result.service.createdAt
        });
      }
    }
  }
});
const Route$3 = createFileRoute("/mcp/service/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const serviceId = url.searchParams.get("serviceId");
        if (!serviceId) {
          return Response.json(
            {
              error: "Missing serviceId"
            },
            { status: 400 }
          );
        }
        const service = getStorageService(serviceId);
        if (!service) {
          return Response.json(
            {
              error: "Service not found"
            },
            { status: 404 }
          );
        }
        return Response.json({
          serviceId: service.id,
          status: service.status,
          region: service.region,
          project: service.project,
          usageCapGb: service.usageCapGb,
          endpoint: service.endpoint,
          accessKeyId: service.accessKeyId,
          updatedAt: service.updatedAt
        });
      }
    }
  }
});
const Route$2 = createFileRoute("/mcp/payment/attach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json();
        if (!payload.accountId || !payload.profile || !payload.wallet) {
          return Response.json(
            {
              error: "Missing accountId, profile, or wallet"
            },
            { status: 400 }
          );
        }
        const attached = attachPaymentProfile({
          accountId: payload.accountId,
          profile: payload.profile,
          wallet: payload.wallet
        });
        if (!attached) {
          return Response.json(
            {
              error: "Account not found"
            },
            { status: 404 }
          );
        }
        return Response.json({
          status: "attached",
          accountId: attached.accountId,
          profile: attached.profile,
          wallet: attached.wallet
        });
      }
    }
  }
});
const Route$1 = createFileRoute("/mcp/keys/rotate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json();
        if (!payload.serviceId) {
          return Response.json(
            {
              error: "Missing serviceId"
            },
            { status: 400 }
          );
        }
        const result = rotateStorageKeys(payload.serviceId, payload.reason);
        if (!result) {
          return Response.json(
            {
              error: "Service not found"
            },
            { status: 404 }
          );
        }
        return Response.json({
          serviceId: result.service.id,
          status: "rotated",
          accessKeyId: result.service.accessKeyId,
          secretAccessKey: result.service.secretAccessKey,
          rotatedAt: result.service.updatedAt,
          reason: result.reason
        });
      }
    }
  }
});
const Route = createFileRoute("/mcp/account/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json();
        if (!payload.orgName || !payload.contact) {
          return Response.json(
            {
              error: "Missing orgName or contact"
            },
            { status: 400 }
          );
        }
        const account = createAccount({
          orgName: payload.orgName,
          contact: payload.contact
        });
        return Response.json({
          accountId: account.id,
          status: "created",
          orgName: account.orgName,
          contact: account.contact,
          createdAt: account.createdAt
        });
      }
    }
  }
});
const StorageRoute = Route$e.update({
  id: "/storage",
  path: "/storage",
  getParentRoute: () => Route$f
});
const RssDotxmlRoute = Route$d.update({
  id: "/rss.xml",
  path: "/rss.xml",
  getParentRoute: () => Route$f
});
const PaymentsRoute = Route$c.update({
  id: "/payments",
  path: "/payments",
  getParentRoute: () => Route$f
});
const McpRoute = Route$b.update({
  id: "/mcp",
  path: "/mcp",
  getParentRoute: () => Route$f
});
const DashboardRoute = Route$a.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$f
});
const AuthRoute = Route$9.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$f
});
const AboutRoute = Route$8.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$f
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$f
});
const BlogIndexRoute = Route$6.update({
  id: "/blog/",
  path: "/blog/",
  getParentRoute: () => Route$f
});
const BlogSlugRoute = Route$5.update({
  id: "/blog/$slug",
  path: "/blog/$slug",
  getParentRoute: () => Route$f
});
const McpStorageProvisionRoute = Route$4.update({
  id: "/storage/provision",
  path: "/storage/provision",
  getParentRoute: () => McpRoute
});
const McpServiceStatusRoute = Route$3.update({
  id: "/service/status",
  path: "/service/status",
  getParentRoute: () => McpRoute
});
const McpPaymentAttachRoute = Route$2.update({
  id: "/payment/attach",
  path: "/payment/attach",
  getParentRoute: () => McpRoute
});
const McpKeysRotateRoute = Route$1.update({
  id: "/keys/rotate",
  path: "/keys/rotate",
  getParentRoute: () => McpRoute
});
const McpAccountCreateRoute = Route.update({
  id: "/account/create",
  path: "/account/create",
  getParentRoute: () => McpRoute
});
const McpRouteChildren = {
  McpAccountCreateRoute,
  McpKeysRotateRoute,
  McpPaymentAttachRoute,
  McpServiceStatusRoute,
  McpStorageProvisionRoute
};
const McpRouteWithChildren = McpRoute._addFileChildren(McpRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AboutRoute,
  AuthRoute,
  DashboardRoute,
  McpRoute: McpRouteWithChildren,
  PaymentsRoute,
  RssDotxmlRoute,
  StorageRoute,
  BlogSlugRoute,
  BlogIndexRoute
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$5 as R,
  allBlogs as a,
  router as r
};
