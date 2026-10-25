export const ROLES = [
  ["designer", "Garment designer"], ["textile_artist", "Textile artist"], ["pattern_maker", "Pattern maker"],
  ["maker", "Maker / atelier"], ["photographer", "Photographer"], ["stylist", "Stylist"], ["musician", "Musician / sound"],
] as const;
export const OPEN_TO = [
  ["commissions", "Paid commissions"], ["licensing", "Licensing my patterns / techniques"],
  ["production", "Production work for others"], ["derivatives", "Derivative / upcycle rights on my garments"],
] as const;
export const RATE_BASIS = [["day", "Day rate"], ["piece", "Per piece"], ["unit", "Per unit (production)"], ["royalty", "Royalty only"], ["negotiable", "Negotiable"]] as const;
export const HERITAGE_RELATION = [
  ["practitioner", "I practice this tradition — it is mine"],
  ["learned", "I learned it from a practitioner / community"],
  ["inspired", "I am inspired by it from outside"],
  ["none", "My work doesn't draw on a specific tradition"],
] as const;
export const LICENSES = [["attribution_royalty", "Attribution + negotiated royalty"], ["attribution", "Attribution only"], ["closed", "Closed — no reuse"]] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "GHS", "NGN", "ZAR", "JPY", "KRW", "INR", "BRL", "MXN", "CNY"];
export const STEPS = ["Identity", "Lineage", "Craft & terms", "Work", "Agreement"] as const;
