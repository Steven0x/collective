import Stripe from "stripe";
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
let s: Stripe | null = null;
export function stripe() {
  if (!s) s = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return s;
}
