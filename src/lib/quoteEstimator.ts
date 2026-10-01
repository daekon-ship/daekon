/* =========================================================================
   quoteEstimator — honest, keyword-based project estimator.
   Runs entirely in the browser (nothing is sent anywhere): it matches
   feature keywords in the visitor's description and sums realistic HUF
   ranges per feature. Output is an estimate, never a final quote.
   ========================================================================= */

export interface QuoteFeature {
  id: string;
  label: string;
  min: number; // Ft
  max: number; // Ft
  weeksMin: number;
  weeksMax: number;
  recurring?: boolean; // monthly price, not one-off
}

interface CatalogEntry extends QuoteFeature {
  keywords: string[]; // already accent-stripped, lowercase
}

const CATALOG: CatalogEntry[] = [
  {
    id: "web",
    label: "Egyedi weboldal",
    min: 250_000, max: 500_000, weeksMin: 2, weeksMax: 3,
    keywords: ["weboldal", "honlap", "landing", "onepage", "one page", "bemutatkozo", "ceges oldal", "vizitkartya"],
  },
  {
    id: "webshop",
    label: "Webshop / e-kereskedelem",
    min: 900_000, max: 1_800_000, weeksMin: 8, weeksMax: 12,
    keywords: ["webshop", "webaruhaz", "e-kereskedelem", "ekereskedelem", "termek", "kosar", "raktar"],
  },
  {
    id: "ordering",
    label: "Rendelési / foglalási rendszer",
    min: 700_000, max: 1_500_000, weeksMin: 6, weeksMax: 10,
    keywords: ["rendeles", "foglalas", "etterem", "idopont", "asztalfoglalas", "nyomkovetes", "etel", "pincer"],
  },
  {
    id: "admin",
    label: "Admin felület / CRM",
    min: 500_000, max: 1_000_000, weeksMin: 4, weeksMax: 8,
    keywords: ["admin", "kezelofelulet", "tartalomkezeles", "dashboard", "crm", "jogosultsag", "riport"],
  },
  {
    id: "backend",
    label: "Backend / API / adatbázis",
    min: 400_000, max: 900_000, weeksMin: 4, weeksMax: 8,
    keywords: ["api", "backend", "szerver", "adatbazis", "integracio", "migracio", "rest", "graphql"],
  },
  {
    id: "auth",
    label: "Belépés / felhasználók",
    min: 200_000, max: 400_000, weeksMin: 2, weeksMax: 3,
    keywords: ["login", "belepes", "regisztracio", "felhasznalo", "profil", "tagok", "szerepkor"],
  },
  {
    id: "payment",
    label: "Online fizetés",
    min: 250_000, max: 500_000, weeksMin: 2, weeksMax: 3,
    keywords: ["fizetes", "bankkartya", "stripe", "paypal", "barion", "otp simple"],
  },
  {
    id: "mobile",
    label: "Mobil / PWA",
    min: 200_000, max: 450_000, weeksMin: 2, weeksMax: 4,
    keywords: ["mobil", "telefon", "pwa", "app", "alkalmazas", "play store", "app store"],
  },
  {
    id: "seo",
    label: "SEO + teljesítmény",
    min: 150_000, max: 350_000, weeksMin: 1, weeksMax: 2,
    keywords: ["seo", "google", "teljesitmeny", "sebesseg", "lighthouse", "core web vitals"],
  },
  {
    id: "design",
    label: "Egyedi design / arculat",
    min: 300_000, max: 700_000, weeksMin: 3, weeksMax: 5,
    keywords: ["design", "arculat", "logo", "markazas", "premium", "egyedi megjelenes", "ux", "ui"],
  },
  {
    id: "motion3d",
    label: "3D / egyedi animáció",
    min: 250_000, max: 600_000, weeksMin: 2, weeksMax: 4,
    keywords: ["3d", "animacio", "interaktiv", "kreativ", "efekt", "mozgas", "webgl"],
  },
  {
    id: "blog",
    label: "Blog / tartalomkezelés",
    min: 150_000, max: 350_000, weeksMin: 1, weeksMax: 2,
    keywords: ["blog", "cikk", "hir", "hirlevel", "tartalom"],
  },
  {
    id: "maintenance",
    label: "Karbantartás / üzemeltetés",
    min: 80_000, max: 180_000, weeksMin: 0, weeksMax: 0,
    recurring: true,
    keywords: ["karbantartas", "uzemeltetes", "tamogatas", "frissites", "havi", "rendben tartas"],
  },
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface QuoteResult {
  features: QuoteFeature[];
  min: number;
  max: number;
  weeksMin: number;
  weeksMax: number;
  recurring?: QuoteFeature;
}

/** Match features against the description; empty input → empty result. */
export function estimate(input: string): QuoteResult {
  const norm = normalize(input);
  if (norm.trim().length === 0) {
    return { features: [], min: 0, max: 0, weeksMin: 0, weeksMax: 0 };
  }
  const features: QuoteFeature[] = CATALOG.filter((f) =>
    f.keywords.some((k) => norm.includes(k)),
  ).map((entry) => {
    const { keywords: _kw, ...rest } = entry;
    void _kw;
    return rest;
  });

  const oneOff = features.filter((f) => !f.recurring);
  const recurring = features.find((f) => f.recurring);

  const round = (n: number) => Math.round(n / 10_000) * 10_000;
  const min = round(oneOff.reduce((s, f) => s + f.min, 0));
  const max = round(oneOff.reduce((s, f) => s + f.max, 0));
  // some work runs in parallel — the calendar time is less than the sum
  const weeksMin = oneOff.length ? Math.max(...oneOff.map((f) => f.weeksMin)) : 0;
  const weeksMax = oneOff.length
    ? Math.min(20, Math.max(weeksMin + 1, Math.round(oneOff.reduce((s, f) => s + f.weeksMax, 0) * 0.8)))
    : 0;

  return { features, min, max, weeksMin, weeksMax, recurring };
}

const fmt = new Intl.NumberFormat("hu-HU");

export function formatFt(n: number): string {
  return fmt.format(n);
}

export function formatWeeks(min: number, max: number): string {
  if (min === 0 && max === 0) return "—";
  if (min === max) return `${min} hét`;
  return `${min}–${max} hét`;
}

/** Pre-filled mail body summarizing the estimate. */
export function mailtoHref(text: string, result: QuoteResult): string {
  const lines = [
    "Szia!",
    "",
    "Szeretnék projektet indítani. Amit elképzelek:",
    "",
    `„${text.trim()}"`,
    "",
  ];
  if (result.features.length) {
    lines.push("Az asszisztens által felismert funkciók:");
    for (const f of result.features) {
      lines.push(`- ${f.label}${f.recurring ? " (havi díjas)" : ""}`);
    }
    lines.push("");
    lines.push(`Becsült ár: ${formatFt(result.min)}–${formatFt(result.max)} Ft`);
    lines.push(`Becsült határidő: ${formatWeeks(result.weeksMin, result.weeksMax)}`);
  }
  lines.push(
    "",
    "(Tudom, hogy ez csak becslés — a végleges árat a részletek egyeztetése után várom.)",
  );
  const subject = encodeURIComponent("Projekt megkeresés — AI árajánlat");
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:hello@daekon.hu?subject=${subject}&body=${body}`;
}
