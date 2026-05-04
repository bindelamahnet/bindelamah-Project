# BDCC ERP

Production-ready Next.js + Supabase starter for the BDCC ERP menu, authentication context, and role-based sidebar.

## What is included

- Supabase schema for companies, projects, roles, permissions, user roles, menu items, and role menu permissions.
- Idempotent seed migration generated from `menu_items.json`.
- Arabic RTL login page with company and project selection.
- Dynamic RTL dashboard sidebar loaded from Supabase.
- API routes for `/api/menu`, `/api/permissions`, `/api/context`, and `/api/context/options`.
- Supabase SSR browser/server clients and session proxy.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

4. Apply migrations in order from `supabase/migrations`.

5. Run the app:

```bash
npm run dev
```

## Seed regeneration

`menu_items.json` is the source of truth for the Arabic ERP hierarchy. After changing it, regenerate the seed migration:

```bash
npm run db:generate-seed
```

## Deployment

Deploy as a standard Next.js app. Configure the two public Supabase environment variables in the hosting platform, then apply the Supabase migrations to the target project before first login.
