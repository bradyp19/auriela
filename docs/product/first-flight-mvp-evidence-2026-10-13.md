# Connected flight fixture increment: evidence

October 13, 2026. This is a private local fixture journey, not proof of supplier search, payment or tickets.

## Implemented and demonstrated

- `/app/flights` connects guided in-app messages and itinerary review to `/api/flights` and SQLite. The existing workspace links to it.
- One adult, supported US airports, economy/business, one-way/round-trip; actual outbound and return segments are displayed with local times/zones and total/terms/baggage.
- Explicit approval includes the exact server snapshot revision. Material price/itinerary/baggage/terms changes invalidate approval even under a reused supplier ID.
- Attempt identity is committed before simulated checkout; concurrent submissions reuse it. Unknown outcomes remain pending and verify the existing attempt before another purchase.
- Session ownership is enforced; oversized/malformed/cross-origin mutations are rejected. API/database/supplier configuration stays server-side, and local credentials are ignored by Git.
- Booking records and accepted reminders survive reload/restart. One booking attempt per browser session is the temporary retention limit; another search is blocked after any attempt.
- Opted-in airport-arrival fallback reminders emit once during server checks. No leave-home calculation or closed-app messaging is claimed.

## Observed checks

- `npm test`: 90 tests across five files passed after the final UI/approval integration; regressions were observed failing before fixes.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run build -- --webpack`: passed, including `/app/flights` and the dynamic `/api/flights` route.
- Standard Turbopack build passed in hosted GitHub Actions on prior branch increments. Local Turbopack CSS subprocess binding failed with OS permission denial, so local build evidence uses the documented Webpack option.
- Real loopback API: request → lowest $240 fixture offer → approval → simulated completion → reload recovery → reminder opt-in passed. Additional price-change reapproval and uncertain-outcome reconciliation scenarios passed against the actual API.
- Browser: JFK–LAX request for October 14 → priced offer → required consent → simulated completion → 1,440-minute opt-in fallback reminder → reload retained the booking and one reminder. New search controls disabled after the booking. Desktop layout inspected.
- Real SQLite tests exercised close/reopen recovery, multiple connections/concurrent checkout, stale same-ID approvals, terminal record retention and once-only reminders.

GitHub Actions CI is configured for push, pull request and manual runs, with tests/typecheck/lint/build on Node 24 and no supplier credentials. Final review and final hosted run evidence are recorded with the merge handoff; prior successful runs: [CI setup](https://github.com/bradyp19/auriela/actions/runs/38462549067), [flight contracts/security](https://github.com/bradyp19/auriela/actions/runs/38463251210).

## Exact remaining supplier dependency

The saved environment contains configured LiteAPI and Duffel credentials, but no recognizable Nuitée `sand_` sandbox key or Duffel test token. No authenticated supplier request was sent and no credential value was printed or committed. Add a Nuitée sandbox key locally as `NUITEE_SANDBOX_API_KEY`, then verify authorized sandbox search/refresh before implementing or enabling real embedded checkout.

Still unverified: account flight entitlement, actual offer response data, embedded supplier payment intent/checkout, ticket evidence and supplier reconciliation. A configured key or simulation reference is not a supplier-confirmed booking. Supplier checkout is disabled when a non-fixture mode is selected.

## Limits

No deployment, live supplier mutation, purchase, charge, SMS/WhatsApp transport, background notifications or production account authentication. Narrow-screen/browser error-recovery paths were not interactively exercised; render and server tests cover their applicable state boundaries. SQLite is local and unencrypted. Existing dependency audit findings affect the transitive lint chain; no forced major-version downgrade was applied. Existing Vite configuration and Node 24.4 SQLite experimental warnings remain.
