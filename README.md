# Yakini

> **We build what you build on.**

Digital infrastructure for small businesses, culinary entrepreneurs,
and founders who are serious about growth.

---

## Live Site

[yakini.digital](https://yakini.digital)

---

## About

Yakini means "one who is certain." We build websites, lead capture
systems, client portals, mobile apps, and AI-powered business tools
for operators who need institutional-grade infrastructure without
agency pricing.

**Industries served:**
- Culinary (personal chefs, restaurants, food trucks, caterers)
- Energy & oilfield services
- Small business & founders

---

## Stack

| Layer | Tech |
|---|---|
| Web Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Deployment | Vercel |
| Email | Resend |
| Mobile | React Native + Expo (coming) |
| AI | Claude API — Anthropic (coming) |
| Version Control | GitHub |

---

## Project Structure
yakini/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx          ← homepage
│   │   ├── services/         ← /services
│   │   ├── pricing/          ← /pricing
│   │   ├── work/             ← /work
│   │   └── process/          ← /process
│   ├── api/
│   │   └── leads/route.ts    ← lead capture API
│   └── layout.tsx            ← root layout
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── sections/
│       ├── Hero.tsx
│       ├── Services.tsx
│       ├── Pricing.tsx
│       └── IntakeForm.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── types/
└── index.ts
---

## Service Tiers

| Tier | Name | Price |
|---|---|---|
| 1 | Authority — Website | $1,500 – $3,500 |
| 2 | Conversion — Lead Systems | $3,500 – $6,000 |
| 3 | Operations — Dashboards | $6,000 – $12,000 |
| 4 | Retention — Mobile Apps | $10,000 – $20,000+ |
| 5 | Intelligence — AI Tools | Custom |

---

## Active Clients

| Client | Industry | Status |
|---|---|---|
| Pettít Luxe Group | Culinary | In Progress |
| PX3 Energy Services | Oilfield | Coming Soon |

---

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
---

## Deployment

Push to `main` → Vercel auto-deploys → live at `yakini.digital`

---

## Contact

hello@yakini.digital

---

*© 2026 Yakini LLC — We build what you build on.*
