import type { ReactNode } from "react";
import { Logo } from "@/components/brand-logo";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <main className="legal-page">
      <header className="legal-header"><Logo /><a href="/">Back to leaderboard</a></header>
      <article>
        <div className="eyebrow"><span>OVERMCP</span>{eyebrow}</div>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        <div className="legal-content">{children}</div>
      </article>
    </main>
  );
}
