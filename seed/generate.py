"""Generate fake seed data for the collective: artists, works, contributions,
influences, timeline events, licenses, orders, royalty ledger.
All people, brands and works are fictional."""
import json, random, os
from datetime import date, timedelta

random.seed(42)
OUT = os.path.dirname(os.path.abspath(__file__))

# ---------- Artists ----------
ARTISTS = [
    # id, name, roles, city, country, lat, lng, bio
    ("art_001", "Abena Owusu-Ansah", ["textile_artist"], "Kumasi", "Ghana", 6.6885, -1.6244,
     "Third-generation kente weaver reinterpreting strip-woven geometry for contemporary silhouettes."),
    ("art_002", "Lukas Brandt", ["designer"], "Berlin", "Germany", 52.5200, 13.4050,
     "Outerwear designer working in deadstock wool and recycled nylon. Techno-utilitarian cuts."),
    ("art_003", "Ximena Ortiz Rueda", ["photographer", "stylist"], "Mexico City", "Mexico", 19.4326, -99.1332,
     "Campaign photographer. Shoots on expired film and CRT monitors."),
    ("art_004", "Kenji Morimoto", ["musician"], "Tokyo", "Japan", 35.6762, 139.6503,
     "Composer of ambient and breakbeat scores for runway and campaign film."),
    ("art_005", "Priya Raghunathan", ["textile_artist", "pattern_maker"], "Jaipur", "India", 26.9124, 75.7873,
     "Hand block-printer. Licenses motifs under attribution + royalty terms."),
    ("art_006", "Tomás Albuquerque", ["maker"], "Porto", "Portugal", 41.1579, -8.6291,
     "Fourth-generation shoemaker. Small-batch Goodyear-welted boots and sandals."),
    ("art_007", "Zanele Mokoena", ["designer"], "Johannesburg", "South Africa", -26.2041, 28.0473,
     "Streetwear designer. Upcycles workwear uniforms into tailored pieces."),
    ("art_008", "Hana Kowalczyk", ["designer", "pattern_maker"], "Warsaw", "Poland", 52.2297, 21.0122,
     "Pattern cutter and designer. Zero-waste block construction."),
    ("art_009", "Diego Salazar", ["maker"], "Oaxaca", "Mexico", 17.0732, -96.7266,
     "Backstrap loom weaver and natural dyer (cochineal, indigo)."),
    ("art_010", "Mei-Lin Zhao", ["photographer"], "Shanghai", "China", 31.2304, 121.4737,
     "Editorial photographer. Y2K digital-camera aesthetic."),
    ("art_011", "Oluwaseun Adeyemi", ["designer", "stylist"], "Lagos", "Nigeria", 6.5244, 3.3792,
     "Designer and stylist. Adire resist-dye meets technical fabrics."),
    ("art_012", "Ingrid Solheim", ["textile_artist"], "Bergen", "Norway", 60.3913, 5.3221,
     "Knitwear artist. Reinterprets selbu mitten motifs at garment scale."),
    ("art_013", "Rafael Nunes", ["musician"], "São Paulo", "Brazil", -23.5505, -46.6333,
     "Producer. Baile funk and modular synth for runway audio."),
    ("art_014", "Aiko Tanaka", ["maker"], "Kyoto", "Japan", 35.0116, 135.7681,
     "Indigo dye house. Hand-dyes yardage for small runs."),
    ("art_015", "Noor Haddad", ["designer"], "Beirut", "Lebanon", 33.8938, 35.5018,
     "Eveningwear designer. Tatreez embroidery on technical mesh."),
    ("art_016", "Callum Fraser", ["photographer", "musician"], "Glasgow", "UK", 55.8642, -4.2518,
     "Shoots and scores. Lo-fi camcorder campaign films."),
    ("art_017", "Sofía Benítez", ["pattern_maker", "textile_artist"], "Buenos Aires", "Argentina", -34.6037, -58.3816,
     "Digital textile designer. Generative patterns printed on recycled poly."),
    ("art_018", "Dae-Jung Park", ["designer"], "Seoul", "South Korea", 37.5665, 126.9780,
     "Technical tailoring. Modular garments with detachable panels."),
    ("art_019", "Fatou Diallo", ["maker"], "Dakar", "Senegal", 14.7167, -17.4677,
     "Atelier running a fair-wage production line, 12 seamstresses."),
    ("art_020", "Elias Weber", ["stylist"], "Vienna", "Austria", 48.2082, 16.3738,
     "Stylist and set designer for lookbooks."),
]
ROLE_CRAFT = {"designer": "design", "textile_artist": "textile", "pattern_maker": "textile",
              "photographer": "photo", "stylist": "photo", "musician": "sound", "maker": "make"}
AVAIL = ["open", "open", "limited", "booked"]
LICENSES = ["closed", "attribution", "attribution_royalty", "attribution_royalty"]

artists = []
for a in ARTISTS:
    aid, name, roles, city, country, lat, lng, bio = a
    slug = name.lower().replace(" ", "-").replace("ã", "a").replace("í", "i").replace("é", "e").replace("ó", "o")
    artists.append({
        "id": aid, "slug": slug, "name": name, "roles": roles,
        "primary_craft": ROLE_CRAFT[roles[0]],
        "city": city, "country": country, "lat": lat, "lng": lng,
        "bio": bio,
        "availability": random.choice(AVAIL),
        "default_license": random.choice(LICENSES),
        "portrait": f"/media/portraits/{aid}.jpg",
        "joined_at": str(date(2025, random.randint(1, 12), random.randint(1, 28))),
        "socials": {"instagram": "@" + slug.split("-")[0] + ".studio"},
    })

# ---------- Works ----------
# Source works (patterns, photos, tracks) then garments that reuse them.
works = []
def W(id, type, title, owner, year, desc, media=None, price=None, drop=None):
    o = next(x for x in artists if x["id"] == owner)
    works.append({
        "id": id, "slug": title.lower().replace(" ", "-"), "type": type, "title": title,
        "owner_id": owner, "lat": o["lat"], "lng": o["lng"], "city": o["city"],
        "year": year, "description": desc,
        "media": media or [f"/media/works/{id}_1.jpg", f"/media/works/{id}_2.jpg"],
        "price_usd": price, "drop_id": drop,
        "license": o["default_license"],
    })

# Source works
W("wrk_p01", "pattern", "Adweneasa Strip", "art_001", 2024, "Kente strip motif, 7-colour warp, digitised for licensing.")
W("wrk_p02", "pattern", "Jaipur Buta Grid", "art_005", 2023, "Hand-carved block print, paisley on a 4cm grid.")
W("wrk_p03", "pattern", "Selbu Rose XL", "art_012", 2024, "Selbu mitten rose scaled to 40cm repeat for jacquard knit.")
W("wrk_p04", "pattern", "Noise Field 04", "art_017", 2025, "Generative Perlin-noise textile, seeded, printed on recycled poly.")
W("wrk_p05", "pattern", "Tatreez Cross Set", "art_015", 2023, "Palestinian cross-stitch motifs redrawn for machine embroidery.")
W("wrk_p06", "technique", "Cochineal Overdye", "art_009", 2022, "Natural overdye process on reclaimed denim.")
W("wrk_p07", "technique", "Adire Eleko Resist", "art_011", 2024, "Cassava-paste resist on technical nylon.")
W("wrk_p08", "technique", "Kyoto Aizome 12-dip", "art_014", 2021, "Twelve-dip indigo for deep saturation on hemp.")
W("wrk_ph1", "photo", "Static Garden", "art_003", 2025, "Campaign series shot through CRT monitors.")
W("wrk_ph2", "photo", "Pudong Flash", "art_010", 2025, "Direct-flash digicam lookbook.")
W("wrk_ph3", "photo", "Tenement Tape", "art_016", 2025, "Camcorder stills, Glasgow close.")
W("wrk_t01", "track", "Loom Signal", "art_004", 2025, "Ambient breakbeat built from loom recordings.")
W("wrk_t02", "track", "Baile Modular 2", "art_013", 2025, "Funk carioca drums + modular pads, 2:40.")
W("wrk_t03", "track", "Close Hum", "art_016", 2025, "Lo-fi drone for runway walk.")

# Garments
W("wrk_g01", "garment", "Kumasi Field Jacket", "art_002", 2025,
  "Deadstock wool field jacket with kente-strip yoke and recycled-nylon lining.", price=420, drop="drop_001")
W("wrk_g02", "garment", "Buta Grid Workshirt", "art_008", 2025,
  "Zero-waste block workshirt in block-printed organic cotton.", price=260, drop="drop_001")
W("wrk_g03", "garment", "Selbu Overcoat", "art_018", 2025,
  "Modular jacquard-knit overcoat, detachable sleeves.", price=640, drop="drop_001")
W("wrk_g04", "garment", "Noise Field Shell", "art_002", 2026,
  "Lightweight shell printed with generative noise textile.", price=380, drop="drop_002")
W("wrk_g05", "garment", "Tatreez Mesh Dress", "art_015", 2025,
  "Technical mesh slip with machine tatreez panels.", price=510, drop="drop_001")
W("wrk_g06", "garment", "Overdye Uniform Trouser", "art_007", 2025,
  "Upcycled security-uniform trouser, cochineal overdye.", price=230, drop="drop_002")
W("wrk_g07", "garment", "Adire Cargo", "art_011", 2026,
  "Technical cargo pant with adire resist panels.", price=340, drop="drop_002")
W("wrk_g08", "garment", "Aizome Hemp Coat", "art_018", 2026,
  "12-dip indigo hemp duster, modular collar.", price=720, drop="drop_002")
W("wrk_g09", "garment", "Kumasi Field Jacket v2 (upcycled)", "art_007", 2026,
  "Licensed derivative: Field Jacket pattern re-cut from reclaimed workwear.", price=390, drop="drop_003")
W("wrk_g10", "garment", "Porto Strip Boot", "art_006", 2025,
  "Goodyear-welted boot with kente-strip pull tab.", price=560, drop="drop_001")

# ---------- Contributions ----------
# (garment, contributor, role, source_work, split_pct)
CONTRIB = [
    ("wrk_g01", "art_002", "designer", None, 50), ("wrk_g01", "art_001", "pattern", "wrk_p01", 20),
    ("wrk_g01", "art_003", "photography", "wrk_ph1", 8), ("wrk_g01", "art_004", "soundtrack", "wrk_t01", 4),
    ("wrk_g01", "art_019", "production", None, 18),
    ("wrk_g02", "art_008", "designer", None, 55), ("wrk_g02", "art_005", "pattern", "wrk_p02", 20),
    ("wrk_g02", "art_010", "photography", "wrk_ph2", 8), ("wrk_g02", "art_019", "production", None, 17),
    ("wrk_g03", "art_018", "designer", None, 50), ("wrk_g03", "art_012", "pattern", "wrk_p03", 22),
    ("wrk_g03", "art_016", "photography", "wrk_ph3", 6), ("wrk_g03", "art_016", "soundtrack", "wrk_t03", 4),
    ("wrk_g03", "art_019", "production", None, 18),
    ("wrk_g04", "art_002", "designer", None, 52), ("wrk_g04", "art_017", "pattern", "wrk_p04", 22),
    ("wrk_g04", "art_003", "photography", "wrk_ph1", 8), ("wrk_g04", "art_013", "soundtrack", "wrk_t02", 4),
    ("wrk_g04", "art_019", "production", None, 14),
    ("wrk_g05", "art_015", "designer", None, 60), ("wrk_g05", "art_015", "pattern", "wrk_p05", 10),
    ("wrk_g05", "art_020", "styling", None, 6), ("wrk_g05", "art_010", "photography", "wrk_ph2", 8),
    ("wrk_g05", "art_019", "production", None, 16),
    ("wrk_g06", "art_007", "designer", None, 55), ("wrk_g06", "art_009", "technique", "wrk_p06", 20),
    ("wrk_g06", "art_016", "photography", "wrk_ph3", 8), ("wrk_g06", "art_019", "production", None, 17),
    ("wrk_g07", "art_011", "designer", None, 58), ("wrk_g07", "art_011", "technique", "wrk_p07", 12),
    ("wrk_g07", "art_003", "photography", "wrk_ph1", 8), ("wrk_g07", "art_013", "soundtrack", "wrk_t02", 4),
    ("wrk_g07", "art_019", "production", None, 18),
    ("wrk_g08", "art_018", "designer", None, 50), ("wrk_g08", "art_014", "technique", "wrk_p08", 24),
    ("wrk_g08", "art_010", "photography", "wrk_ph2", 8), ("wrk_g08", "art_004", "soundtrack", "wrk_t01", 4),
    ("wrk_g08", "art_019", "production", None, 14),
    # derivative: royalties flow back to g01's design + pattern
    ("wrk_g09", "art_007", "designer", None, 45), ("wrk_g09", "art_002", "source_design", "wrk_g01", 15),
    ("wrk_g09", "art_001", "pattern", "wrk_p01", 12), ("wrk_g09", "art_016", "photography", "wrk_ph3", 8),
    ("wrk_g09", "art_019", "production", None, 20),
    ("wrk_g10", "art_006", "maker", None, 70), ("wrk_g10", "art_001", "pattern", "wrk_p01", 15),
    ("wrk_g10", "art_003", "photography", "wrk_ph1", 8), ("wrk_g10", "art_020", "styling", None, 7),
]
contributions = []
for i, (w, c, role, src, pct) in enumerate(CONTRIB, 1):
    contributions.append({
        "id": f"con_{i:03d}", "work_id": w, "contributor_id": c, "role": role,
        "source_work_id": src, "split_pct": pct,
        "status": "confirmed" if random.random() > 0.08 else "pending",
        "confirmed_at": str(date(2025, random.randint(3, 12), random.randint(1, 28))),
    })

# ---------- Influences (non-person origins) ----------
influences = [
    {"id": "inf_001", "work_id": "wrk_p01", "place": "Bonwire, Ashanti", "lat": 6.7700, "lng": -1.5260,
     "era": "17th c.–present", "tradition": "Asante kente strip weaving", "note": "Named adweneasa pattern lineage."},
    {"id": "inf_002", "work_id": "wrk_p02", "place": "Bagru, Rajasthan", "lat": 26.8104, "lng": 75.5420,
     "era": "1700s", "tradition": "Bagru block printing", "note": "Buta (paisley) motif on natural dye."},
    {"id": "inf_003", "work_id": "wrk_p03", "place": "Selbu, Trøndelag", "lat": 63.2200, "lng": 11.0400,
     "era": "1850s", "tradition": "Selbu two-colour knitting", "note": "Marit Emstad's eight-petal rose."},
    {"id": "inf_004", "work_id": "wrk_p05", "place": "Ramallah", "lat": 31.9038, "lng": 35.2034,
     "era": "19th c.", "tradition": "Palestinian tatreez", "note": "Cypress and cross motifs."},
    {"id": "inf_005", "work_id": "wrk_p06", "place": "Teotitlán del Valle", "lat": 17.0290, "lng": -96.5200,
     "era": "pre-Hispanic", "tradition": "Zapotec cochineal dyeing", "note": "Insect-derived red."},
    {"id": "inf_006", "work_id": "wrk_p07", "place": "Abeokuta, Ogun", "lat": 7.1475, "lng": 3.3619,
     "era": "early 1900s", "tradition": "Yoruba adire eleko", "note": "Cassava-starch resist."},
    {"id": "inf_007", "work_id": "wrk_p08", "place": "Tokushima", "lat": 34.0658, "lng": 134.5593,
     "era": "Edo period", "tradition": "Awa aizome indigo", "note": "Sukumo fermented indigo."},
    {"id": "inf_008", "work_id": "wrk_g01", "place": "Berlin, Kreuzberg", "lat": 52.4990, "lng": 13.4030,
     "era": "1990s", "tradition": "Techno-utilitarian clubwear", "note": "Field jacket silhouette reference."},
    {"id": "inf_009", "work_id": "wrk_ph1", "place": "Mexico City, Tepito", "lat": 19.4440, "lng": -99.1250,
     "era": "2000s", "tradition": "Tianguis CRT stalls", "note": "Monitor-stack staging."},
    {"id": "inf_010", "work_id": "wrk_g06", "place": "Johannesburg CBD", "lat": -26.2050, "lng": 28.0400,
     "era": "2010s", "tradition": "Security uniform surplus", "note": "Source garments for upcycle."},
    {"id": "inf_011", "work_id": "wrk_t02", "place": "Rio de Janeiro, Complexo do Alemão", "lat": -22.8600, "lng": -43.2700,
     "era": "2000s", "tradition": "Baile funk", "note": "Tamborzão rhythm."},
    {"id": "inf_012", "work_id": "wrk_g03", "place": "Seoul, Dongdaemun", "lat": 37.5663, "lng": 127.0090,
     "era": "2020s", "tradition": "Modular techwear", "note": "Detachable panel construction."},
]

# ---------- Timeline events ----------
STAGES = ["concept", "pattern_licensed", "sample", "campaign_shoot", "preorder_open",
          "funded", "production", "shipped", "repair_offered", "upcycled"]
timeline = []
tid = 1
for g in [w for w in works if w["type"] == "garment"]:
    start = date(2025, random.randint(1, 8), random.randint(1, 28)) if g["year"] == 2025 else date(2025, random.randint(9, 12), random.randint(1, 28))
    d = start
    n = 8 if g["drop_id"] != "drop_003" else 6
    conts = [c for c in contributions if c["work_id"] == g["id"]]
    for stage in STAGES[:n]:
        place = next(a for a in artists if a["id"] == g["owner_id"])
        ref = None
        if stage == "pattern_licensed":
            ref = next((c for c in conts if c["source_work_id"]), None)
            if ref: place = next(a for a in artists if a["id"] == ref["contributor_id"])
        if stage == "campaign_shoot":
            ref = next((c for c in conts if c["role"] == "photography"), None)
            if ref: place = next(a for a in artists if a["id"] == ref["contributor_id"])
        if stage in ("production", "shipped"):
            ref = next((c for c in conts if c["role"] == "production"), None)
            if ref: place = next(a for a in artists if a["id"] == ref["contributor_id"])
        timeline.append({
            "id": f"evt_{tid:03d}", "work_id": g["id"], "stage": stage, "date": str(d),
            "city": place["city"], "lat": place["lat"], "lng": place["lng"],
            "contribution_id": ref["id"] if ref else None,
            "media": f"/media/timeline/{g['id']}_{stage}.jpg" if stage in ("sample", "campaign_shoot", "production") else None,
        })
        tid += 1
        d += timedelta(days=random.randint(12, 40))
    # derivative link for g09
    if g["id"] == "wrk_g01":
        timeline.append({"id": f"evt_{tid:03d}", "work_id": "wrk_g01", "stage": "upcycled", "date": "2026-02-14",
                         "city": "Johannesburg", "lat": -26.2041, "lng": 28.0473,
                         "contribution_id": "con_041", "media": None})
        tid += 1

# ---------- Drops ----------
drops = [
    {"id": "drop_001", "name": "Capsule 01 — Signal", "opens": "2025-09-15", "closes": "2025-10-20",
     "status": "fulfilled", "goal_units": 60},
    {"id": "drop_002", "name": "Capsule 02 — Resist", "opens": "2026-01-20", "closes": "2026-03-01",
     "status": "in_production", "goal_units": 80},
    {"id": "drop_003", "name": "Derivatives 01", "opens": "2026-10-01", "closes": "2026-11-15",
     "status": "preorder_open", "goal_units": 40},
]

# ---------- Collectors + orders ----------
COLLECTORS = [("usr_c01", "Marta Keller", "Zürich"), ("usr_c02", "Jordan Ellis", "New York"),
              ("usr_c03", "Yuki Sato", "Osaka"), ("usr_c04", "Amara Okafor", "London"),
              ("usr_c05", "Lucas Moreau", "Lyon"), ("usr_c06", "Chen Wei", "Singapore"),
              ("usr_c07", "Isabel Torres", "Madrid"), ("usr_c08", "Sam Patel", "Toronto")]
collectors = [{"id": i, "name": n, "city": c, "role": "collector"} for i, n, c in COLLECTORS]

orders = []
oid = 1
for g in [w for w in works if w["type"] == "garment"]:
    drop = next(d for d in drops if d["id"] == g["drop_id"])
    n = random.randint(4, 9) if drop["status"] != "preorder_open" else random.randint(2, 4)
    for _ in range(n):
        col = random.choice(collectors)
        qty = 1 if random.random() > 0.15 else 2
        orders.append({
            "id": f"ord_{oid:03d}", "collector_id": col["id"], "work_id": g["id"], "drop_id": drop["id"],
            "qty": qty, "unit_price_usd": g["price_usd"], "total_usd": g["price_usd"] * qty,
            "status": {"fulfilled": "fulfilled", "in_production": "paid", "preorder_open": "paid"}[drop["status"]],
            "placed_at": str(date.fromisoformat(drop["opens"]) + timedelta(days=random.randint(0, 25))),
        })
        oid += 1

# ---------- Licenses ----------
licenses = [
    {"id": "lic_001", "source_work_id": "wrk_p01", "licensee_id": "art_002", "scope": "single garment, 100 units",
     "royalty_pct": 20, "status": "signed", "signed_at": "2025-04-02"},
    {"id": "lic_002", "source_work_id": "wrk_p02", "licensee_id": "art_008", "scope": "single garment, 100 units",
     "royalty_pct": 20, "status": "signed", "signed_at": "2025-05-11"},
    {"id": "lic_003", "source_work_id": "wrk_p03", "licensee_id": "art_018", "scope": "single garment, 60 units",
     "royalty_pct": 22, "status": "signed", "signed_at": "2025-06-30"},
    {"id": "lic_004", "source_work_id": "wrk_g01", "licensee_id": "art_007", "scope": "derivative upcycle, 40 units",
     "royalty_pct": 15, "status": "signed", "signed_at": "2026-01-18"},
    {"id": "lic_005", "source_work_id": "wrk_p04", "licensee_id": "art_002", "scope": "single garment, 80 units",
     "royalty_pct": 22, "status": "signed", "signed_at": "2025-11-05"},
    {"id": "lic_006", "source_work_id": "wrk_p01", "licensee_id": "art_006", "scope": "footwear detail, 50 pairs",
     "royalty_pct": 15, "status": "signed", "signed_at": "2025-07-14"},
    {"id": "lic_007", "source_work_id": "wrk_p05", "licensee_id": "art_018", "scope": "single garment, 60 units",
     "royalty_pct": 20, "status": "requested", "signed_at": None},
    {"id": "lic_008", "source_work_id": "wrk_p08", "licensee_id": "art_007", "scope": "overdye, 40 units",
     "royalty_pct": 18, "status": "negotiating", "signed_at": None},
]

# ---------- Royalty ledger (append-only) ----------
PLATFORM_FEE = 0.10
ledger = []
lid = 1
for o in orders:
    net = round(o["total_usd"] * (1 - PLATFORM_FEE), 2)
    for c in [c for c in contributions if c["work_id"] == o["work_id"] and c["status"] == "confirmed"]:
        amt = round(net * c["split_pct"] / 100, 2)
        ledger.append({
            "id": f"led_{lid:04d}", "contribution_id": c["id"], "artist_id": c["contributor_id"],
            "work_id": o["work_id"], "order_id": o["id"], "license_id": None,
            "amount_usd": amt, "currency": "USD",
            "status": "paid" if o["status"] == "fulfilled" else "accrued",
            "created_at": o["placed_at"],
        })
        lid += 1

# ---------- Write ----------
data = {
    "artists": artists, "works": works, "contributions": contributions, "influences": influences,
    "timeline_events": timeline, "drops": drops, "collectors": collectors, "orders": orders,
    "licenses": licenses, "royalty_ledger": ledger,
}
for k, v in data.items():
    with open(os.path.join(OUT, f"{k}.json"), "w") as f:
        json.dump(v, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT, "seed.json"), "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Map-ready payloads
pins = [{"artist_id": a["id"], "name": a["name"], "craft": a["primary_craft"], "city": a["city"],
         "lat": a["lat"], "lng": a["lng"],
         "work_count": sum(1 for w in works if w["owner_id"] == a["id"]) +
                       sum(1 for c in contributions if c["contributor_id"] == a["id"] and c["role"] not in ("designer",))}
        for a in artists]
with open(os.path.join(OUT, "map_pins.json"), "w") as f:
    json.dump(pins, f, indent=2, ensure_ascii=False)

def lineage(work_id, depth=0):
    w = next(x for x in works if x["id"] == work_id)
    nodes, arcs = [], []
    for c in [c for c in contributions if c["work_id"] == work_id]:
        a = next(x for x in artists if x["id"] == c["contributor_id"])
        nodes.append({"contribution_id": c["id"], "artist_id": a["id"], "name": a["name"], "role": c["role"],
                      "lat": a["lat"], "lng": a["lng"], "split_pct": c["split_pct"],
                      "source_work_id": c["source_work_id"]})
        arcs.append({"from": [a["lng"], a["lat"]], "to": [w["lng"], w["lat"]], "type": c["role"],
                     "contribution_id": c["id"]})
        if c["source_work_id"] and depth < 3:
            sub = lineage(c["source_work_id"], depth + 1)
            nodes += sub["nodes"]; arcs += sub["arcs"]
    for inf in [i for i in influences if i["work_id"] == work_id]:
        nodes.append({"influence_id": inf["id"], "name": inf["tradition"], "role": "influence",
                      "lat": inf["lat"], "lng": inf["lng"], "era": inf["era"], "place": inf["place"]})
        arcs.append({"from": [inf["lng"], inf["lat"]], "to": [w["lng"], w["lat"]], "type": "influence",
                     "influence_id": inf["id"]})
    return {"work_id": work_id, "nodes": nodes, "arcs": arcs}

lineages = {g["id"]: {**lineage(g["id"]),
                      "timeline": [e for e in timeline if e["work_id"] == g["id"]],
                      "derivatives": [c["work_id"] for c in contributions if c["source_work_id"] == g["id"]]}
            for g in works if g["type"] == "garment"}
with open(os.path.join(OUT, "map_lineage.json"), "w") as f:
    json.dump(lineages, f, indent=2, ensure_ascii=False)

print({k: len(v) for k, v in data.items()}, "pins", len(pins), "lineages", len(lineages))
