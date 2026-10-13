# Aurelia

Private local flight MVP alongside the original travel planning demo. The connected journey lives at `/app/flights`; the older `/app` workspace continues to use browser-local demonstration data.

## Run locally

Use Node 24 (the server uses built-in SQLite):

```sh
nvm use
npm ci
npm run dev
```

Open `http://127.0.0.1:3000/app/flights`. Flight requests support one adult, selected US airports, one-way/round-trip and economy/business. Guided messages and explicit controls collect the request; this MVP does not use an LLM or send SMS/WhatsApp.

The default supplier is **simulated fixture inventory**. Its prices, checkout and reservations do not represent real tickets or payments. Use the labeled fixture scenarios to check changed prices/terms, unavailability and uncertain outcomes. Approve the exact itinerary, total and terms before simulated checkout. An uncertain outcome must be verified using its existing attempt; a second purchase is blocked.

Approval also requires the server's current snapshot revision, so a stale tab cannot approve newly changed terms under a reused supplier offer ID. This first slice retains one booking journey per browser session: once an attempt exists, another search is blocked to preserve the booking and its accepted reminder. Booking history across multiple journeys is deferred.

## Local state and credentials

Copy `.env.example` to `.env.local` only if you have not already created that file. Configure locally; never paste credentials into chat or commit them.

```dotenv
AURELIA_FLIGHT_MODE=fixture
AURELIA_DB_PATH=.data/flights.sqlite
NUITEE_SANDBOX_API_KEY=
```

Put only a Nuitée/LiteAPI **sandbox** key after the final equals sign. Setting a key does not establish flight entitlement or enable checkout. Actual sandbox search, embedded supplier payment and ticket verification need separate evidence; real checkout remains disabled until those contracts and access are verified. No production-key fallback is permitted.

SQLite state is stored under `.data/` by default and ignored by Git, including WAL sidecars. Browser sessions use an HttpOnly cookie. Saved approvals, attempts and messages survive reloads and server restarts while the cookie remains available. This provides private sandbox session isolation, not a production identity system; losing the cookie loses access to that session. Local database files are not encrypted, so use test data.

Reminders are opt-in and generated once when the open app checks the server. Accept the explicitly labeled airport-arrival fallback when travel time from home is unknown. There is no closed-app notification, SMS/WhatsApp delivery or live flight-status feed.

## Verification and CI

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs these checks on pushes, pull requests and manual dispatches with Node 24 and no supplier credentials. Deployment is deferred until a host with persistent database storage is selected. Do not deploy this session-cookie sandbox as a public booking service.

If this machine's sandbox blocks Turbopack's local CSS worker port, `npm run build -- --webpack` uses Next.js's documented alternative bundler. The standard Turbopack build remains the CI check; report local and hosted results separately.

Supplier contract references: [search](https://docs.liteapi.travel/reference/post_flights-rates.md), [verify](https://docs.liteapi.travel/reference/post_flights-verify.md), [booking retrieval](https://docs.liteapi.travel/reference/get_flights-bookings-bookingid.md). Supplier display totals can contain markup beyond base/taxes/fees, and a booking reference alone is insufficient ticket evidence.
