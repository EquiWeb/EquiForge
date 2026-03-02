import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-8">
      <section className="band-shell rounded-2xl p-6 sm:p-8">
        <img
          src="/images/lagoon-about.svg"
          alt=""
          className="mb-6 h-56 w-full rounded-2xl object-cover"
        />
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          EquiForge is the control plane for agent infrastructure.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          We are building a x402-native SaaS that helps agents discover, pay for,
          and operate cloud services. Storage launches first, then compute,
          with MCP as the primary interface for provisioning and operations.
        </p>
      </section>
    </main>
  )
}
