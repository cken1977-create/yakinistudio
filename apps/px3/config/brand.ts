import type { BrandConfig } from "@yakini/config";

export const config: BrandConfig = {
  business: {
    name: "PX3 Energy",
    dba: "PX3 Energy",
    tagline: "Production Performances · Odessa, Texas",
    description:
      "PX3 Energy is a roustabout outfit in the Permian Basin — West Texas and southern New Mexico. We send crews to the pad that are current, accounted for, and ready to work.",
  },
  brand: {
    designSystem: "editorial",
    colors: {
      primary: "#c45a1a",
      accent: "#c4a46a",
      background: "#0a0a0a",
      text: "#efe8dc",
      textMuted: "#8a8580",
      border: "rgba(196, 164, 106, 0.28)",
    },
    fonts: {
      display: "Playfair Display",
      body: "DM Sans",
    },
    logo: {
      dark: "/mark.png",
      light: "/mark.png",
      text: "PX3",
    },
    favicon: "/mark.png",
  },
  contact: {
    email: "ops@px3prestige.com",
    phone: "",
    location: "Odessa, TX",
    hours: "Jobs run when the field runs",
  },
  social: [],
  services: {
    headline: "What we send",
    subheadline: "Roustabout and location labor. West Texas and southern New Mexico.",
    items: [
      {
        title: "Roustabout crews",
        description:
          "Roustabout hands for locations across the Permian. The roster is named. The cards are dated.",
        icon: "01",
        features: ["Named crew sheet", "Site requirements on the job", "Swap when a card is stale"],
      },
      {
        title: "Location labor",
        description:
          "Extra hands on the location when the operator is short. We do not take work we cannot finish. No theater. No mystery packet.",
        icon: "02",
        features: ["Owner-asserted site packs", "H2S and orientation tracked", "Clean packet or a dirty exception — never mixed"],
      },
      {
        title: "Operator-ready paper",
        description: "The file that leaves the shop matches the people on the lease road.",
        icon: "03",
        features: ["Documented vs asserted, labeled", "No fake same-morning cards", "Yakini ops when you need the gate"],
      },
    ],
  },
  about: {
    headline: "The outfit",
    subheadline: "Prestige is the standard. Production is the work.",
    story: `PX3 Energy works the Permian from West Texas into southern New Mexico. The name on the truck is the name on the pad.
We built the company the way the field actually runs: small crew, real jobs, no spare safety department. The digital layer exists so a hand is either current or honestly excepted — not guessed.`,
    mission:
      "Send the right person to the right pad with a file that can survive the gate.",
    values: [
      { title: "Current", description: "A stale card is a morning, not a surprise." },
      { title: "Named", description: "The crew sheet is people, not a headcount." },
      { title: "Honest", description: "If we roll on an exception, it does not print as compliance." },
    ],
  },
  portfolio: {
    headline: "Work",
    subheadline: "Permian production. Named crews.",
    items: [
      {
        title: "Production locations",
        category: "Field",
        description: "Crews dispatched against owner-asserted site requirements.",
        year: "2026",
      },
    ],
  },
  home: {
    hero: {
      headline: "Production performances.",
      subheadline:
        "Roustabout. Permian Basin. Hands that can stand on the location this morning.",
      cta: "Request a crew",
      ctaLink: "/contact",
      secondaryCta: "View services",
      secondaryCtaLink: "/services",
      image: "/mark.png",
    },
    featuredServices: [0, 1, 2],
  },
  contactPage: {
    headline: "Put us on the job",
    subheadline: "Location, timing, what the operator requires.",
    formIntro: "Tell us the pad and the window. We will tell you who can roll.",
  },
  portal: {
    enabled: true,
    welcomeMessage: "PX3 ops. Crew wallet, packs, and Composer.",
  },
  seo: {
    siteUrl: "https://px3.yakini.digital",
    keywords: ["PX3", "PX3 Energy", "Odessa oilfield", "Permian production", "oilfield services Odessa"],
    ogImage: "/mark.png",
  },
  yakini: {
    clientId: "px3",
    tier: "authority",
    showCredit: true,
  },
};