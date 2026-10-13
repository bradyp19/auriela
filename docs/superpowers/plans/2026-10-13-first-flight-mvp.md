# First Flight MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Demonstrate a durable private in-app flight journey with truthful fixture/supplier status, exact approval, recovery and reminders.

**Architecture:** Add `/app/flights` alongside the existing demo. Next.js server routes own a session-isolated SQLite ledger and a flight supplier interface. Start with explicit fixtures; enable real sandbox operations only after verifying secure access and response contracts.

**Tech Stack:** Existing Next.js 16.4, React, TypeScript, Zod and Vitest; Node 24 built-in SQLite; GitHub Actions.

**Spec:** [Approved design](../specs/2026-10-13-first-flight-mvp-design.md). User approved October 13 and requested frequent commits and CI/CD.

## Global Constraints

- One adult, US domestic, one-way or round-trip, economy/business; no live tickets, charges, account mutations, webhooks or deployment.
- Private local sandbox, in-app messaging and local durable database; no real SMS/WhatsApp transport.
- Changed itinerary/total/terms requires fresh approval; unknown outcomes require verification before retry.
- Secrets stay server-only and git-ignored. Fixtures never claim real supplier confirmation or tickets.
- Read installed Next.js guides before product code. Preserve shared untracked docs and existing demo tests.
- Commit each tested deliverable on `codex/first-flight-mvp`; root alone stages/commits/pushes named files, never force pushes.
- User requested focused agents; use them for implementation and fresh reviews with exclusive file ownership. Root owns integration.
- CI runs without credentials; deployment remains deferred unless the user supplies a compatible host and approves revised deployment scope.

## Review Focus

- Same-day one-way dates and DST/time-zone boundaries: validate calendar dates without the demo's minimum-night rule (Task 1).
- Browser session ownership and forged client prices/status: reject before touching another session or trusting a submitted snapshot (Tasks 2–3).
- Duplicate submissions, process restart and a timeout before receiving a supplier identifier: preserve the existing attempt and block a second purchase (Task 2).
- Provider missing terms/ticket evidence or changed return segments: block purchase/confirmation appropriately (Tasks 1–2).
- Reminder reloads and long closed-app periods: deliver once on next check and label absence of background transport (Tasks 2–4).

## File ownership and interfaces

Server agent owns `src/flights/types.ts`, `validation.ts`, `supplier.ts`, `fixture.ts`, `repository.ts`, `service.ts` and `tests/flights*.test.ts`. Root owns server routes, security tests, configuration, docs and CI. UI agent owns `src/components/flight-journey.tsx`, `src/app/app/flights/page.tsx` and dedicated flight CSS. Root adds a visible link in `workspace.tsx`. Agents never commit or change another owner's files.

Shared contract: `FlightRequest` has `origin`, `destination`, `departureDate`, optional `returnDate`, `cabin: 'economy' | 'business'`, and `adults: 1`. `FlightOffer` contains opaque ID, mode, full segments, USD total/breakdown, baggage, terms and expiry. `FlightJourney` exposes request, messages, current offer, approved snapshot, attempt status, verified booking evidence and reminder. Public snapshots exclude payment/API secrets.

`FlightSupplier` supplies `search(request)`, `verify(offer)`, `beginCheckout(offer, attemptId)`, and `reconcile(attempt)`; explicit outcomes distinguish pending, failed and verified completion. `FlightRepository(path)` supplies durable session-owned journey load/save and atomic attempt/reminder operations; no supplier calls inside a DB transaction. `FlightService(repository, supplier, now)` exposes `get(sessionId)` and `act(sessionId, action)` returning `Promise<FlightJourney>`.

Actions: `request` with validated fields; `approve` with server offer ID and explicit acceptance; `checkout` with the approved ID; `verify`; `reminder` with opt-in/lead time/fallback acceptance. Exact Zod discriminated action schema is defined by the server owner before the UI task starts. Approval never accepts client price/terms. Fixture checkout uses test controls, never card fields.

## Task 1: Flight contracts and deterministic supplier boundary

- [ ] Root installs locked dependencies with `npm ci`, reads installed route-handler/server/environment guides, runs existing `npm test` baseline. Document environment blockers instead of changing version pins blindly.
- [ ] Server agent writes failing tests: valid same-day one-way and round-trip; reject impossible/past dates, unknown/non-US airports, identical airports, adults other than 1 and invalid cabin; preserve actual return segments; choose lowest matching total; reject missing mandatory price/terms.
- [ ] Run `npm test -- tests/flights-validation.test.ts`; confirm failures describe missing behavior.
- [ ] Implement types, Zod validation and a fixture supplier with domestic airport/time-zone metadata and transparent coverage. Fixture scenarios include normal, changed price/terms, unavailable and uncertain completion; all output carries fixture mode. Reuse `validDate`/`money` where semantics fit.
- [ ] Run focused tests; fresh reviewer checks scope/correctness, then root commits `feat: add validated fixture flight offers`.

## Task 2: Durable approval, attempt recovery and reminders

- [ ] Server agent writes failing SQLite/service integration tests using temporary databases and injected clock/supplier: reload after close/reopen retains messages/approval; changed itinerary/terms/price invalidates approval; expired/unavailable offer blocks checkout; concurrent checkout creates one attempt; timeout then restart retains unknown status; verification reuses original attempt; payment-only/prebook-only evidence never confirms; session B cannot access session A; due reminder emits once and requires opt-in/fallback acceptance.
- [ ] Run `npm test -- tests/flights-service.test.ts`; record red result before implementation.
- [ ] Implement `FlightRepository` and `FlightService` with immutable server offer snapshots, atomic claim before supplier call, recoverable pending ledger, explicit fixture confirmation copy, and due reminders generated during reads. Validate supplier output at the boundary and reject unsafe values. Unrecoverable missing supplier IDs stay pending for operator resolution; do not issue another purchase.
- [ ] Run focused persistence/recovery tests; fresh reviewer checks races, ownership and secrets, then root commits `feat: persist approved flight journeys and recovery`.

## Task 3: Server routes, safe configuration and CI

- [ ] Root writes failing route/security tests: server-issued HttpOnly session cookie; ownership from cookie rather than submitted ID; malformed/oversized bodies and cross-origin mutations rejected; authoritative amounts/status cannot be forged; public output excludes credentials; errors do not leak secrets.
- [ ] Run `npm test -- tests/flights-routes.test.ts`; confirm red.
- [ ] Implement `src/app/api/flights/route.ts` GET/POST in Node runtime, with a small `src/flights/server.ts` composition module. Use request origin validation and documented Next cookies APIs. Return consistent JSON errors, no-store snapshots and explicit provider mode.
- [ ] Add `.env.example` with empty server-only sandbox key and local DB path names; ignore database/WAL files; declare/document Node 24 compatibility. Default fixture mode, never fallback to a live supplier key.
- [ ] Add `.github/workflows/ci.yml`: pull requests, pushes and manual dispatch; minimal read-only permissions; Node 24, `npm ci`, tests, typecheck, lint and build; cancel superseded branch runs. No secrets, external purchases or automatic deployment. Do not label CI as deployed CD.
- [ ] Run focused tests plus `npm run typecheck`, `npm run lint`, `npm run build`; review workflow syntax and root commits `feat: expose flight journey API and add CI checks`.

## Task 4: Connected in-app messaging journey

- [ ] UI agent reads shared contracts and accessible existing UI. Builds `/app/flights` using dedicated styles and server snapshots, guided message prompts/controls for origin, destination, dates/cabin, resolved itinerary, price breakdown, terms and explicit approval.
- [ ] Checkout appears only for approved unchanged offer. Fixture mode prominently says simulated payment/reservation/no real ticket. Pending outcome provides verification, not a second purchase. Include reload recovery, retryable read errors, opt-in reminder lead time/fallback wording, and no background-delivery claim.
- [ ] Root links the journey from the existing workspace, preserving hotel/demo behavior. Check accessible labels, focus, disabled duplicate actions and readable responsive layouts.
- [ ] Run typecheck/lint/build and browser flow: request → offer → approval → checkout → fixture verified outcome → reminder; reload retains state. Demonstrate changed-offer reapproval and pending verification. Record actual checks and screenshots only when useful.
- [ ] Fresh reviewer checks UI/spec and root commits `feat: connect flight messaging and review experience`.

## Task 5: Secure supplier readiness and release evidence

- [ ] Root creates setup/run documentation with fixture scenario commands, database location, local session limits, reminder behavior and secure `.env.local` provisioning instructions. Do not ask for secrets in chat or fetch the Notion API KEY page wholesale.
- [ ] If a securely provisioned sandbox key becomes available, a focused supplier agent owns `src/flights/nuitee.ts` and supplier contract tests. Write failing mocked HTTP tests for documented search/verify schemas, malformed outputs, timeout behavior, and redacted failures; implement only verified contracts. Exercise sandbox read-only search/verify first. Embedded checkout remains disabled without verified intent/order/ticket contracts; account-card simulation does not establish embedded checkout.
- [ ] Exercise only approved sandbox test reservations/payment when key type, account support and test instruments are verified. Persist prebook/transaction references and use documented reconciliation; distinguish actual evidence from mock/fixture results. Commit tested adapter work separately or explicitly document blocked supplier operations.
- [ ] Run all tests, typecheck, lint, build and available browser checks once the final changes are integrated. Fresh whole-branch review verifies acceptance criteria and resolves actionable findings.
- [ ] Commit final evidence/setup docs; inspect remote branch refs and push `codex/first-flight-mvp` without force. Report local checks separately from GitHub Actions results; never claim CI ran without a recorded run.

## Execution handoff

Preserve the user's selected orchestration method: focused subagents with root integration and reviews. This plan awaits user review as required by the writing-plans workflow. After that review, execute the tasks in order and commit at each passing deliverable. Supplier access is the only external integration dependency; fixture implementation can proceed without it but does not complete the real supplier journey.
