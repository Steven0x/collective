import { Window } from "@/components/ui";
import { GlyphColumn, Stars, KenteStrip, AdinkraGrid } from "@/components/motifs";

export const metadata = { title: "About — COLLECTIVE" };

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-16">
      <section className="relative overflow-hidden border border-line p-8 md:p-14 min-h-[60vh] flex flex-col justify-end">
        <Stars className="absolute inset-0 w-full h-full" seed={7} />
        <GlyphColumn className="absolute left-0 top-0 h-full w-10 md:w-14" seed={1} />
        <GlyphColumn className="absolute right-0 top-0 h-full w-10 md:w-14" seed={4} />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg to-transparent" />
        <div className="relative px-8">
        <div className="mono text-yellow">MANIFESTO // V0.4</div>
        <h1 className="display text-5xl md:text-7xl mt-2 riso">
          CULTURE INSPIRES.
          <br />GARMENTS ARE MADE WITH INTENTION.
          <br /><span className="riso-yellow">EVERY HAND GETS PAID.</span>
        </h1>
        <p className="text-muted text-lg mt-6 max-w-2xl">
          We are not another marketplace for independent designers. We are a network where
          creative work accumulates value for the people who made it — across borders, across
          disciplines, and across the life of a garment.
        </p>
        </div>
      </section>

      <section id="how" className="space-y-4 relative">
        <KenteStrip className="absolute -inset-x-4 -top-4 h-2 w-[calc(100%+2rem)]" seed={2} />
        <h2 className="display text-3xl">HOW IT WORKS</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Window title="01 // CREATIVE COMMONS">
            <p className="text-muted text-sm">Artists voluntarily share selected designs, techniques and motifs for reinterpretation. Every contribution is attributed on the map; commercial derivatives pay negotiated royalties.</p>
          </Window>
          <Window title="02 // MULTIDISCIPLINARY">
            <p className="text-muted text-sm">Designers collaborate with textile artists, photographers, musicians, stylists and makers on paid commissions with transparent credit. Find them on the Collaborate board.</p>
          </Window>
          <Window title="03 // CIRCULAR">
            <p className="text-muted text-sm">Preorders finance limited production. Garments can be repaired or upcycled. Contributors opt in to a contractual share of qualifying derivative proceeds.</p>
          </Window>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="display text-3xl">ONE JACKET, FIVE CITIES</h2>
        <ol className="grid md:grid-cols-5 gap-3">
          {[
            ["KUMASI", "A textile artist contributes an original kente strip pattern under attribution + royalty."],
            ["BERLIN", "A designer licenses it for a field jacket. The license is signed on-platform."],
            ["MEXICO CITY / TOKYO", "A photographer shoots the campaign; a musician scores it. Both are credited with a split."],
            ["DAKAR", "Customers preorder. A fair-wage atelier manufactures once the run is funded."],
            ["JOHANNESBURG", "A second designer licenses the jacket for an upcycled variation. Payments flow back to every original contributor."],
          ].map(([c, t], i) => (
            <li key={c} className="border-l border-line pl-3">
              <div className="mono text-yellow">0{i + 1}</div>
              <div className="nav text-xs mt-1">{c}</div>
              <p className="text-sm text-muted mt-1">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="licensing" className="space-y-4 relative overflow-hidden">
        <AdinkraGrid className="absolute -right-10 -top-10 w-72 opacity-15" rows={4} cols={6} />
        <h2 className="display text-3xl">LICENSING &amp; ROYALTIES, PLAINLY</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Window title="WHAT YOU KEEP">
            <ul className="mono text-muted space-y-2">
              <li>→ YOU OWN YOUR DESIGNS. ALWAYS.</li>
              <li>→ YOU CHOOSE: CLOSED / ATTRIBUTION / ATTRIBUTION + ROYALTY.</li>
              <li>→ EVERY LICENSE IS A SIGNED, ONE-PAGE AGREEMENT.</li>
              <li>→ THE ROYALTY LEDGER IS PUBLIC AND APPEND-ONLY.</li>
            </ul>
          </Window>
          <Window title="WHAT IS NOT PROMISED">
            <ul className="mono text-muted space-y-2">
              <li>→ NO ROYALTY ON ORDINARY SECONDHAND RESALE. THAT IS NOT OWED AND WE DO NOT PRETEND IT IS.</li>
              <li>→ DERIVATIVE ROYALTIES ONLY ON OPT-IN, CONTRACTED REUSE WE CAN TRACK.</li>
              <li>→ ATTRIBUTION IS NOT PROTECTION. CULTURAL MOTIFS REQUIRE AN ORIGIN STATEMENT AND CURATOR REVIEW.</li>
            </ul>
          </Window>
        </div>
        <p className="mono text-muted">STANDARD SPLIT DEFAULT: 70% ARTISTS &amp; CONTRIBUTORS (AS DECLARED) · 20% PRODUCTION · 10% PLATFORM. NEGOTIABLE PER WORK.</p>
      </section>

      <section id="faq" className="space-y-3">
        <h2 className="display text-3xl">FAQ</h2>
        {[
          ["Is the collective artist-owned?", "Decision pending. Phase 0 runs as a founder-operated platform where artists retain full ownership of their IP; a membership structure is on the roadmap."],
          ["How are royalties paid?", "Manually, monthly, from the public ledger during the capsule phase. Automated payouts via Stripe Connect arrive in Phase 3."],
          ["What if my pattern is used without permission?", "Report it from your studio. Unlicensed reuse is a breach of the artist agreement and results in removal."],
          ["Where is production?", "Fair-wage partners who are themselves members of the collective, with a pin on the map and a split in the ledger."],
        ].map(([q, a]) => (
          <details key={q} className="win p-4 group">
            <summary className="nav text-xs cursor-pointer list-none flex justify-between">{q}<span className="text-muted group-open:rotate-45 transition-transform">+</span></summary>
            <p className="text-muted text-sm mt-3">{a}</p>
          </details>
        ))}
      </section>

      <section id="apply">
        <Window title="APPLY // ARTIST ONBOARDING" right="5 STEPS">
          <ol className="grid md:grid-cols-5 gap-3 mono text-muted">
            <li>01 CHOOSE ROLE(S)</li><li>02 PIN YOUR CITY</li><li>03 UPLOAD 3 WORKS</li><li>04 PICK DEFAULT LICENSE</li><li>05 CURATOR REVIEW</li>
          </ol>
          <button className="btn btn-green mt-4">Start application (demo)</button>
        </Window>
      </section>
    </div>
  );
}
