import { Resend } from "resend";

// All notifications go through here. No-ops (logs) until RESEND_API_KEY + EMAIL_FROM are set.
const enabled = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const shell = (title: string, body: string, cta?: { label: string; href: string }) => `
<div style="background:#0b0a1a;color:#f4ecd8;font-family:ui-monospace,Menlo,monospace;padding:32px">
  <div style="font-size:11px;letter-spacing:.08em;color:#ffd23f">COLLECTIVE_</div>
  <h1 style="font-family:system-ui,sans-serif;font-size:28px;margin:12px 0 16px;text-shadow:2px 0 #ff2d95,-2px 0 #38e8ff">${title}</h1>
  <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#e8e0cc">${body}</div>
  ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;padding:10px 16px;border:1px solid #ffd23f;color:#ffd23f;text-decoration:none;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${cta.label}</a>` : ""}
  <div style="margin-top:32px;font-size:11px;color:#a89f8c">Artist-owned. Every hand gets paid.</div>
</div>`;

export async function sendEmail(to: string, subject: string, title: string, body: string, cta?: { label: string; href: string }) {
  if (!enabled()) { console.log(`[email:disabled] to=${to} subject=${subject}`); return { skipped: true }; }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM!, to, subject, html: shell(title, body, cta) });
  if (error) console.error("[email]", error);
  return { skipped: false, error };
}

export const emails = {
  profileSubmitted: (to: string, name: string) =>
    sendEmail(to, "Your profile is in review", `Thanks, ${name}.`, "A curator will review your profile and lineage statement. You'll hear back within a few days. Meanwhile you can browse the map and preorder.", { label: "Open the map", href: `${site()}/map` }),
  profileApproved: (to: string, name: string, slug: string) =>
    sendEmail(to, "Your pin is live", `Welcome, ${name}.`, "Your profile is live on the map. You can now publish works, declare credits, and accept commissions from your studio.", { label: "Open your studio", href: `${site()}/me/studio` }),
  credited: (to: string, name: string, byName: string, role: string, pct: number, workTitle: string) =>
    sendEmail(to, `${byName} credited you on ${workTitle}`, `${byName} credits you as ${role} · ${pct}%`, `on <b>${workTitle}</b>. Accept it in your studio and it starts earning when the garment sells. Decline it and it never will.`, { label: "Review credit", href: `${site()}/me/studio` }),
  creditAccepted: (to: string, contributorName: string, role: string, workTitle: string) =>
    sendEmail(to, `${contributorName} accepted their credit`, `${contributorName} accepted ${role} on ${workTitle}`, "The split is now confirmed and will accrue on every sale.", { label: "Open studio", href: `${site()}/me/studio` }),
  orderConfirmed: (to: string, name: string, workTitle: string, qty: number, total: number, orderId: string) =>
    sendEmail(to, `Preorder confirmed · ${workTitle}`, `Thank you, ${name}.`, `<b>${qty} × ${workTitle}</b> — $${total}. Order ${orderId}. It ships about 90 days after the drop closes. Every confirmed contributor on this garment just accrued their split in the public ledger.`, { label: "Your orders", href: `${site()}/me` }),
};
