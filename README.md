# CityVision

CityVision är en civic-tech frontend där invånare kan upptäcka platser i sin stad, dela förbättringsidéer och rösta på visioner som gör offentliga miljöer bättre.

## Tech stack

- Next.js 14 (App Router), React och TypeScript
- Tailwind CSS och Lucide React
- Mockdata med separerade `types`, `data` och `services`
- Supabase Auth för inloggning med e-postbaserad magic link

Arkitekturen är förberedd för att ersätta mockdatan med API-anrop mot PostgreSQL/PostGIS, object storage och riktig autentisering längre fram. UI:t använder `cityService`, som i sin tur använder ett `CityRepository`-kontrakt. Lägg till en databasimplementation av kontraktet och byt repository i `services/city-service.ts` när backend finns.

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:3010](http://localhost:3010). CityVision använder alltid port 3010 lokalt, så den krockar inte med Uptime Kuma på standardporten. Kontrollera produktionen med `npm run lint` och `npm run build`.

## Supabase Auth

Kopiera `.env.example` till `.env.local` och fyll i projektets URL och anon key från Supabase:

```bash
cp .env.example .env.local
```

Aktivera Email-provider i Supabase och lägg till `http://localhost:3010/auth/callback` som
Redirect URL under Authentication → URL Configuration. Magic links skickar användaren tillbaka
till appen och vidare till sidan som begärde inloggningen.

Dev-servern använder `.next-dev` medan production build använder `.next`. Därför kan du köra `npm run dev` och `npm run build` utan att de skriver över varandras cache. Starta bara en dev-server per port.

Inloggad mockanvändare och dess inställningar sparas i ett samlat `cityvision-user`-objekt i webbläsarens `localStorage`. Objektet innehåller användarprofil, språk, tema och user agent.
