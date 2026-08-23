# PuntacaribeCORE

Event landing page and CRM for PuntacaribeCORE.

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Supabase

The event registration form and private CRM use Supabase.

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` from your Supabase project settings.
3. Apply the SQL files in `supabase/migrations` to your Supabase database in timestamp order.
4. Enable email/password auth in Supabase Auth.
5. Create the first admin from `/auth`: sign up, open `/admin`, then click `Reclamar acceso de administrador`.

No service-role key is required for the public form. Capacity checks and inserts run through Supabase RPC functions with RLS-friendly permissions.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
