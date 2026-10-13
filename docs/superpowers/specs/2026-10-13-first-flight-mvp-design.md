# First connected flight MVP — proposed design

Status: approved October 13, 2026. The connected fixture increment is implemented; real supplier access and checkout remain unverified. See the implementation evidence for actual checks and limits.

## Outcome and agreed limits

A frequent traveler uses in-app messages to request a domestic flight, reviews the lowest total payable matching offer, explicitly approves its itinerary/price/terms, completes supplier-managed checkout when sandbox access is verified, sees an honestly verified outcome, and enables a departure reminder.

The user selected a private local sandbox, in-app messages before SMS/WhatsApp, a local durable database, and no fixed delivery deadline. Scope is one adult, US domestic, one-way or round-trip, economy/business. Hotels, groups, membership billing, inferred preference learning, automatic rebooking, deployment and live tickets are excluded.

Authoritative context: [journey](../../product/first-flight-journey.md), [glossary](../../../GLOSSARY.md), [backend evidence](../../research/aurelia-backend-inheritance-2026-10-13.md), [payment evidence](../../research/aurelia-notion-payment-evidence-2026-10-13.md).

## Approach

Recommended: retain the current demo workspace and add a connected flight journey at `/app/flights`, linked visibly from the existing app. Reuse existing visual styles, accessible UI primitives and USD/date utilities where their semantics fit. Keep flight contracts separate from the hotel-centric `demo:true` types and localStorage schema.

Alternatives considered: converting all demo providers would unnecessarily change hotel/trip consumers; starting with hosted infrastructure would introduce provisioning without improving the first local proof. Neither is part of this slice.

The client calls same-origin Next.js server routes. Server code owns validation, supplier access and SQLite persistence. Use Node's built-in SQLite on the available Node 24 runtime; pin/document a compatible runtime rather than add a database library. A random server-issued HttpOnly session cookie isolates local browser sessions; enforce ownership on every read/mutation and reject cross-origin mutations. This is private sandbox session isolation, not production account authentication.

## Durable journey

Persist session-owned requests/messages, exact offer snapshots, approvals, booking attempts, supplier references/outcomes and reminder preferences in SQLite. Database and secrets are ignored by git. A refresh/restart restores the conversation and outstanding verification state.

Collect origin/destination airports, departure date, optional return date and cabin through guided messages with explicit controls for unresolved fields. Show resolved airports/dates before approval. Do not add an LLM or imply unrestricted natural-language understanding. Validate actual dates, one adult and US domestic eligibility on the server; a request's dates must match the returned flight segments.

Show complete outbound/return segments, local times/time zones, total mandatory price breakdown, baggage information supplied by the provider, cancellation/change restrictions and provider mode. Choose the lowest total among matching returned offers; make searched inventory coverage explicit. Unknown restrictions are displayed as unknown and must prevent purchase when necessary approval terms are missing.

Approval binds to the server's immutable snapshot of itinerary, total and terms. Recheck price/availability before checkout. Any material change returns to review and needs fresh approval. Expiry and unavailable offers prevent checkout. The client cannot supply authoritative prices or supplier status.

The implemented approval action also requires the exact server-issued `offerRevision`, separate from the opaque supplier ID, to reject stale approvals when a supplier reuses its ID. This private first slice permits one booking attempt per browser session; another search is blocked after any attempt to retain booking evidence and accepted reminders. Multiple booked journeys require durable history before that limit is lifted.

Create and commit a durable attempt identity before contacting a supplier. Concurrent/repeated submissions must reuse that attempt. A timeout or ambiguous outcome becomes `verification_pending`; verify the existing attempt before permitting another purchase. A page redirect or payment success alone never confirms a booking. Require supplier order retrieval with documented completed/ticket evidence and references. Preserve pending/failed/verified states distinctly.

## Supplier boundary and secrets

Prefer the existing Nuitée Connect/LiteAPI account after access verification. Its API keys stay server-only, provisioned through a git-ignored local environment file; never paste keys into chat, artifacts or browser code. Discovery found no local supplier/database credential configuration.

Implement a deterministic, clearly labeled fixture adapter first if no verified sandbox credential is available. Fixture offers, payments and reservations are always labeled simulated; no simulated state is described as supplier-confirmed or a real ticket. Exercise changed-price, unavailable, duplicate and ambiguous outcomes through tests and a documented sandbox scenario.

Only implement actual API operations against primary documented contracts; do not invent checkout fields or ticketing semantics. Configure a real supplier adapter only after confirming sandbox key type, flight access and embedded supplier checkout contract. Safe execution scope proposed for approval: read-only sandbox search/refresh/status and sandbox-only reservation/payment with documented test data and test payment instruments. No live key fallback, real card, live booking, external account/webhook change or deployment is permitted. If those sandbox capabilities cannot be verified, disable real checkout and name the exact blocked operation.

Verified documentation boundaries (not exercised account capabilities): API base `https://api.liteapi.travel/v3.0`; `POST /flights/rates` searches legs; `POST /flights/verify` rechecks the opaque offer ID; `POST /flights/prebooks` with `usePaymentSdk: true` creates a reservation and payment session; `GET /flights/prebooks/{prebookId}` resumes it; `POST /flights/bookings` completes the original prebook using supplier transaction payment; `GET /flights/bookings/{bookingId}` reconciles known booking status. Same-prebook replay returns the existing booking, while an in-progress completion can return conflict code `45035`. Persist identifiers before any subsequent mutation; a missing booking identifier after a timeout is unresolved, not permission to create a second prebook. Sources: [search](https://docs.liteapi.travel/reference/post_flights-rates), [verify](https://docs.liteapi.travel/reference/post_flights-verify), [prebook](https://docs.liteapi.travel/reference/post_flights-prebooks), [complete](https://docs.liteapi.travel/reference/post_flights-bookings), [retrieve](https://docs.liteapi.travel/reference/get_flights-bookings-bookingid), [access](https://docs.liteapi.travel/docs/getting-access-to-flights).

The documented account-card sandbox simulation is not proof of embedded traveler payment. Current documentation alone does not establish a universal ticket-document field; actual sandbox response evidence is required before enabling supplier-confirmed ticket claims.

## Reminder

After verified supplier completion (or explicitly simulated fixture completion), offer opt-in reminders. Persist a chosen lead time; suggest a clearly labeled two-hour airport-arrival fallback only when the traveler accepts it. Do not claim a leave-home calculation without a confirmed starting location and travel-time source. Deliver due reminders exactly once as in-app messages when the app next checks the server; state that the private MVP does not deliver background SMS/WhatsApp or closed-app push notifications.

## Delivery and evidence

After spec approval, write a short implementation plan with narrow file ownership for focused agents. Install locked dependencies and read installed Next.js route-handler/server guidance before product code. Use TDD for validation, approval changes, durable attempts, isolation, outcome reconciliation and reminders. Preserve existing tests and all shared untracked documents.

Deliver small commits on `codex/first-flight-mvp`, inspect remote state and push without force. Root owns integration and verification. Demonstrate request → matching offer → approval → fixture or verified sandbox checkout → honest outcome → reminder, including reload/restart recovery and changed/unknown outcomes. Run tests, typecheck, lint, build and browser verification where available. Report fixture evidence separately from actual supplier evidence; the real supplier journey remains incomplete while access/checkout/ticket verification is unavailable.
