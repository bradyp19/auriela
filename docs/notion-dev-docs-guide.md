# Auriela Notion teamspace and development guide

Compiled and expanded 2026-10-13 from the **Auriela** Notion teamspace. This is a source index and workflow guide, not a new product decision or an implementation audit. The expanded review includes every discoverable non-credential page, including the manifesto, marketing, competitor references, visual mockups and brainstorming.

## Start here

For work in this checkout, begin with [the agreed first flight journey](product/first-flight-journey.md) and [the domain glossary](../GLOSSARY.md). Pull the Notion documents below for the particular feature being worked on. Do not import the entire roadmap into every task.

The manifesto supplies the purpose: an agent that acts in the consumer's interests, with consumer control over data and transparent, auditable decisions. The product documents and visual references connect that purpose to a persistent trip that can move between web and messaging. The strongest reusable implementation material concerns explicit booking approval, reliable supplier confirmation, isolation between travelers, preference handling, and trip persistence. The biggest unresolved issue is which immediate delivery scope governs: the July messaging launch, the October web platform, or this checkout's narrower flight journey.

## Coverage and evidence limits

- A fresh teamspace-scoped inventory returned 27 pages. Searches partitioned before and from July 1 returned the same combined set. Across this session, I fetched and read all 26 non-credential pages and followed their child-page references; the references exposed no additional named child pages outside that inventory. This covers everything discoverable through the connector, not inaccessible, archived or unindexed pages.
- All 26 fetched pages were marked **unverified** by Notion. Dates below are reported `page_last_edited_at`, not proof of approval or implementation. Some response snapshot dates differ from this metadata; the table uses the metadata. All listed dates are in 2026.
- Security, Data API Sources, and Repos & Libraries contain six unavailable embedded blocks in total. Their readable content is covered, but those blocks remain unread. A direct block-link fetch for Data API Sources still returned the unavailable placeholder.
- Features contains three image attachments rather than prose. All three were retrieved and visually inspected: web/messaging continuity, the trip workspace demo, and mobile booking/loyalty mockups.
- API KEY was discovered but its content was deliberately not retrieved or copied. Retrieve credentials through the established configuration process when needed.
- The initial 18-page review omitted eight non-credential pages. That gap is now closed: Aristotle Labs manifesto, Competitors, Auriela Media, Misc, Features, Founder Intro Vid, Article Links, and Revenue Ideas are included below.
- External supplier documentation and linked libraries were not independently validated. Provider names and API examples here describe what the internal documents say, not verified current provider capabilities.

## Documents to pull by task

| Document | Use it for | Evidence status / caution | Edited |
| --- | --- | --- | --- |
| [Dev Docs](https://app.notion.com/p/38046a31b58a806eb757e2a431c892d7) | Navigation hub for launch, local testing, problems, and crypto | Index rather than an architecture specification | Oct 9 |
| [Phased Debrief](https://app.notion.com/p/3f446a31b58a802288f7eaa218aea224) | Web platform planning, persistent trips, supplier states, expansion gates, rewards and membership | Most detailed later strategy; no explicit declaration that it supersedes July or the local scope | Oct 9 |
| [V1 Core Features](https://app.notion.com/p/39746a31b58a80b69a24eed28ba4c5bd) | Conversational onboarding, flight/hotel search, payment, preferences, itinerary and dashboard acceptance criteria | July messaging-era specification; includes questions and historical implementation claims | Jul 15 |
| [Sprint 17 Proactive AI](https://app.notion.com/p/38e46a31b58a8019ae39e86311ef78dc) | Booking safety, money confirmation, secrets, memory isolation, provider confirmation, shared data contracts | Especially useful guardrails; unfinished-work notes are historical | Jul 15 |
| [master-sprint-doc](https://app.notion.com/p/38e46a31b58a80598549c501130ab4b7) | Multi-channel identity, tier upgrades, billing, personality, memory, itinerary curation | Sprints 11–16 plus a future group-chat proposal; contains conflicting itinerary gating | Jul 16 |
| [Texting local auriela feature branch](https://app.notion.com/p/38046a31b58a80e2932bc0d771215b74) | Testing the historical SendBlue agent locally | Command and port do not match this checkout's package scripts; webhook must be restored | Jul 14 |
| [Launch Scope](https://app.notion.com/p/39d46a31b58a80299c47e06c2a123f14) | Historical launch priorities and links to detailed specs | Old launch timing/cohort plans and reported completion; not current release evidence | Jul 15 |
| [Problems](https://app.notion.com/p/33f46a31b58a80999750e5e8ae67b0cf) | User pain, preference scenarios, disruption/refund ideas, demonstration conversations | Hardcoded dialogue is illustrative, not live flight, price, refund, or check-in evidence | Oct 9 |
| [Security](https://app.notion.com/p/38946a31b58a809ab003d5f87782c589) | Ownership checks, cross-tenant testing, webhook verification, secret exposure and release checks | Broad checklist with infrastructure assumptions to validate; one unreadable embed | Jul 14 |
| [Price Drop Refunds Framework](https://app.notion.com/p/38d46a31b58a80c1ad9cf4ca2cb7aa54) | Later flight servicing research: eligibility, net savings, change flow, cash versus credit | Proposal with example code and inconsistent amount/sign wording; verify actual supplier semantics before implementation | Jul 14 |
| [Data API Sources](https://app.notion.com/p/38946a31b58a80feafe4fb8d779157f2) | Starting links for flight-data research | Readable links to Aviationstack and Flightradar24; no documented selection, contract or approved integration; one unreadable embed | Jul 15 |
| [Feature Ideas](https://app.notion.com/p/38946a31b58a807ea41efa6eb35951a8) | Future trip graph, personalization, disruption assistance, dynamic itinerary and discovery ideas | Brainstorming; do not treat as committed launch scope | Oct 1 |
| [Design Library](https://app.notion.com/p/38d46a31b58a8021ad28ecb3dc90ac8e) | Finding visual references | Navigation hub | Jul 14 |
| [Repos & Libraries](https://app.notion.com/p/39a46a31b58a80bbadd6e57193366922) | Visual research: gradients, animation, components and icons | Reference collection, not a dependency adoption decision; four unreadable embeds | Aug 5 |
| [Future Integrations](https://app.notion.com/p/38346a31b58a8094af2ad7840365e82d) | Locating an OpenTable MCP reference | Link only; no integration design or access approval | Jul 14 |
| [Crypto](https://app.notion.com/p/39c46a31b58a800796a0c73113664d37) | Historical crypto-payment proposal | Do not use its funding assumptions as an approved booking payment design | Jul 14 |
| [Crypto Privacy](https://app.notion.com/p/39c46a31b58a807799e3c0e0652c03b6) | Historical encryption and decoupled-payment ideas | Proposal; supplier, data-retention, reconciliation and privacy assertions need separate validation | Jul 14 |
| [Token Thesis](https://app.notion.com/p/39c46a31b58a8046994cc061e8854235) | Understanding the crypto market narrative | Short thesis without implementation detail or substantiation of market figures | Jul 14 |
| [Aristotle Labs manifesto](https://app.notion.com/p/32d46a31b58a80e3a81dfb3fa384b2fb) | Product purpose, consumer agency, data control, transparent decision-making and brand voice | Founder thesis; does not specify implementation or validate its historical/economic claims | Oct 3 |
| [Competitors](https://app.notion.com/p/34e46a31b58a8050ab14f1757d9f2362) | Starting inventory for competitive research | Names and links, not a feature comparison; acquisition and biographical notes are unverified | Oct 3 |
| [Auriela Media](https://app.notion.com/p/39d46a31b58a80a0bbafe67d8a27744f) | Finding the founder introduction script | Navigation hub with one child page | Jul 14 |
| [Founder Intro Vid](https://app.notion.com/p/38346a31b58a80e084c4d89cb9c974b6) | Founder narrative, messaging-era positioning and pitch language | Script with launch, partnership, pricing and traction claims; not evidence those claims are true | Jul 14 |
| [Misc](https://app.notion.com/p/38446a31b58a8024a3f1cce10b1d77de) | Exploring a company-offsite coordination workflow | Hypothetical 40-person scenario, assumed savings and inconsistent cost table; separate B2B proposal | Jun 19 |
| [Features](https://app.notion.com/p/3b146a31b58a8040bd7bf2f8d7bb895e) | Visual direction for web/chat continuity, trip canvas, mobile booking and loyalty | Three screenshots inspected; demo labels and illustrative prices distinguish designs from live functionality | Aug 3 |
| [Article Links](https://app.notion.com/p/38946a31b58a80ceb640c65b6b20aa7c) | Locating the collected travel-industry AI article | One external link, no internal analysis; the article itself is outside this Notion review | Jun 24 |
| [Revenue Ideas](https://app.notion.com/p/38946a31b58a8014a75ff4d3df80aa38) | Checking whether revenue brainstorming adds requirements | Empty page; no requirements or decisions to extract | Jun 24 |

The remaining inventory item is [API KEY](https://app.notion.com/p/38846a31b58a808aa229efa9c2bea889). Its content remains excluded by the agreed scope, not silently omitted.

## What the broader teamspace adds

### Manifesto: who the agent serves

The manifesto frames Aurelia as Aristotle Labs' first demonstration of consumer-oriented agentic commerce. Its central concern is that platforms can capture the advantages of AI while steering decisions toward their own economic interests. It argues for consumer data sovereignty, transparent and auditable algorithmic behavior, and deliberately distributed autonomy. Its terms for AI-created advantages include algorithmic patience capital, configurational capacity, and distributed identity capital. These are concepts in the founder's thesis, not validated metrics in this review. [Source: Aristotle Labs manifesto](https://app.notion.com/p/32d46a31b58a80e3a81dfb3fa384b2fb).

Recommended translation into our workflow, rather than claims of existing functionality:

- Explain why an offer is recommended and which inventory was searched; make price, eligibility and commercial conditions visible.
- Preserve the traveler's ability to inspect, correct and delete preferences, and keep consequential actions under explicit traveler approval.
- Review ranking, upselling and reward incentives for whether they serve the traveler or distort the recommendation.
- Keep an auditable record of approvals, offer changes and supplier outcomes without exposing sensitive information.
- Use the manifesto for mission and design review; use feature specs and provider contracts for executable acceptance criteria.

The manifesto does not settle supplier choice, channels, launch sequencing, memory storage, payment design or monetization. Its data-sovereignty principle should not be treated as proof of the stronger anonymity assertions in Crypto Privacy.

### Visual references: one trip across surfaces

The first Features screenshot shows a web-to-text handoff with synchronized trip/preferences/offers and web, iMessage, WhatsApp and Telegram channel choices. It illustrates review and approval in messaging after web search. A displayed hold duration is mockup copy, not a provider guarantee.

The second shows a light web workspace with a conversation and results area alongside a persistent trip canvas, selected items, estimated total and review action. Flights, stays and experiences are separate result tabs. It explicitly labels inventory and prices as demonstrations and says booking requires final review and approval.

The third shows mobile concepts for conversational flight recommendations, a map-based home surface, and a loyalty/card profile. Its flight narrative and displayed route are inconsistent, and its savings, points, balances and card should remain illustrative. The design implication is continuity between planning, recommendations and the traveler profile; it does not authorize adding a card or award redemption to launch. [Source: Features](https://app.notion.com/p/3b146a31b58a8040bd7bf2f8d7bb895e).

These screenshots bridge the apparent web-versus-messaging divide: they describe a shared experience across surfaces. They do not resolve which surface or booking category ships first.

### Marketing and commercial context

Founder Intro Vid pitches a subscription-supported travel engine in messages, with broader booking, loyalty and proactive servicing ambitions. It names Nuitée and Travelfusion, whereas the July development details reference Duffel and LiteAPI. Its launch and revenue narrative is scripted copy, so it must not become implementation status or public proof without supporting evidence. October's Phased Debrief takes a more conditional approach to approved supply, sustainable savings, and staged expansion. [Sources: Founder Intro Vid](https://app.notion.com/p/38346a31b58a80e084c4d89cb9c974b6), [Phased Debrief](https://app.notion.com/p/3f446a31b58a802288f7eaa218aea224).

Misc describes a potential corporate offsite coordinator: collect traveler information, coordinate options and room blocks, distribute booking links, track completion and handle disruptions. Its financial comparisons are assumed and internally inconsistent, not measured customer results. This is a separate customer and authority model from the local individual-traveler scope. Preserve it as B2B discovery material rather than mixing corporate permissions and group inventory into the first flight implementation. [Source: Misc](https://app.notion.com/p/38446a31b58a8024a3f1cce10b1d77de).

Competitors lists StarDrift, Vaya, NexTravels/Perk, Tab, WanderLog, Hipmunk, RocketTrip, Rift.ai and Soar.app, with some links and sparse notes. It supplies candidates for a future comparison, not substantiated conclusions about them. Article Links supplies one Kiandra article; Revenue Ideas is empty; Auriela Media only points to the founder script. None adds a hidden executable development specification. [Sources: Competitors](https://app.notion.com/p/34e46a31b58a8050ab14f1757d9f2362), [Article Links](https://app.notion.com/p/38946a31b58a80ceb640c65b6b20aa7c), [Revenue Ideas](https://app.notion.com/p/38946a31b58a8014a75ff4d3df80aa38), [Auriela Media](https://app.notion.com/p/39d46a31b58a80a0bbafe67d8a27744f).

## Reusable requirements

### Booking, payment and recovery

Use explicit approval for the presented itinerary, total payable price and terms. A payment or booking request must not become a confirmed reservation until the supplier outcome is confirmed. Preserve distinct payment and supplier states, protect against duplicate requests, revalidate stale prices, and recover uncertain outcomes before retrying. These ideas connect [Sprint 17](https://app.notion.com/p/38e46a31b58a8019ae39e86311ef78dc), [Phased Debrief](https://app.notion.com/p/3f446a31b58a802288f7eaa218aea224), and the local first-flight agreement.

For a future hotel implementation, V1 calls for honest handling of unavailable named hotels, real room/rate details, refundability, and fees payable at the property. Sprint 17 calls for payment-session storage of hotel prebook identifiers and a new prebook after abandonment. Treat these as source requirements to reconcile with the chosen provider's current contract. [Sources: V1](https://app.notion.com/p/39746a31b58a80b69a24eed28ba4c5bd), [Sprint 17](https://app.notion.com/p/38e46a31b58a8019ae39e86311ef78dc).

### Preferences, memory and identity

Explicit travel preferences fill missing information without overriding what the traveler asks for. The sprint plan distinguishes explicit preferences, inferred taste, and personal context; inferred taste is reasoning context, and personal context requires restraint and a forget-on-request mechanism. User records should support identity across channels rather than tying all preferences to a single phone number. Every retrieval and mutation needs enforced traveler isolation. [Source: master-sprint-doc](https://app.notion.com/p/38e46a31b58a80598549c501130ab4b7).

The specific memory implementation is unresolved: Launch Scope suggests Mem0, V1 discusses Supabase/pgvector, and the sprint plan describes deliberate inference. Extract the desired behavior before selecting storage. References to `learned`, `taste`, migrations, `scope.ts`, and `PreferenceStore` are historical references to another implementation, not verified files or capabilities in this checkout. [Sources: Launch Scope](https://app.notion.com/p/39d46a31b58a80299c47e06c2a123f14), [V1](https://app.notion.com/p/39746a31b58a80b69a24eed28ba4c5bd), [Sprint 17](https://app.notion.com/p/38e46a31b58a8019ae39e86311ef78dc).

### Trip structure and trustworthy recommendations

Persist a trip so users can resume planning; link searches, shortlists, itinerary entries and booking references to it. Supplier inventory and prices remain distinct from AI-generated prose. Recommendations should be curated from real place data rather than invented places, images or reviews. Separate a saved plan from a live quote and a confirmed booking. [Sources: Phased Debrief](https://app.notion.com/p/3f446a31b58a802288f7eaa218aea224), [master-sprint-doc](https://app.notion.com/p/38e46a31b58a80598549c501130ab4b7).

### Engineering coordination

The sprint documents call for additive changes to shared tables, agreed payment-page identifiers, a shared voice specification (`soul.md`), reviewed branches, and verified replacements before deleting UI. Their worker/backend boundaries refer to the historical system. Apply the coordination principle to the actual checkout rather than assuming those directories exist. [Sources: master-sprint-doc](https://app.notion.com/p/38e46a31b58a80598549c501130ab4b7), [Sprint 17](https://app.notion.com/p/38e46a31b58a8019ae39e86311ef78dc).

## Conflicts to resolve before pulling requirements into a task

| Decision | Conflicting evidence | Workflow recommendation |
| --- | --- | --- |
| Initial product | July V1: messaging flight + hotel booking. October Phased Debrief: web-first hotels/flights/activities. Local agreement: messaging-first domestic flights, hotels later. | Use the local agreed journey for this checkout until an explicit decision changes it. Confirm strategy before broadening scope. |
| Booking suppliers | July names Duffel and LiteAPI. October makes flight booking conditional on approved supplier access. Local agreement leaves supplier selection open. | Verify actual access and funds flow before committing an integration. |
| Launch channels | July emphasizes Spectrum/iMessage and Telegram; local agreement names SMS-style messaging and WhatsApp. | Choose channels deliberately; do not pull the old SendBlue runbook into an unrelated service. |
| Itinerary eligibility | Sprint 12/16 labels: one free itinerary per month, Pro unlimited. Sprint 16 body: Pro feature. | Record one entitlement rule before writing gating logic. |
| Trials and pricing | July discusses three-day upsell and five-day group trial. October proposes $20/month but also retains a $50 reference. | Treat these as unresolved commercial decisions; avoid hardcoded plan/trial assumptions. |
| Crypto funding | July Crypto assumes authorization permits immediate supplier spend without funded balance. October explicitly requires funds, collateral or approved credit and puts finance last. | Keep the historical proposal out of the core implementation; require provider-approved design for any later finance work. |
| Completion status | Launch Scope lists completed items and a desired sprint-complete launch; V1 says end-to-end booking is not ready; local agreement calls this checkout a demonstration. | Require current code, deployment and transaction evidence for every completion claim. |

These are observed differences, not a claim that a later edit formally superseded an earlier decision. Sources are linked in the document index above.

## Local testing mismatch

The historical texting runbook uses `pnpm dev:agent`, tunnels port 8080, changes the SendBlue receive webhook to `/webhooks/sendblue`, then restores the original webhook and checks inbound logs. This checkout's `package.json` has `dev` for Next.js and no `dev:agent` script. Locate the agent service and confirm its port/environment before using that runbook. No webhook was changed during this review. [Source](https://app.notion.com/p/38046a31b58a80e2932bc0d771215b74).

## Suggested workflow for future tasks

1. State the user journey and acceptance criteria using the local scope and glossary.
2. Pull only the relevant source bundle:
   - **Mission and product design:** manifesto + Phased Debrief + Features screenshots; distinguish consumer-interest principles from near-term scope.
   - **Flight booking:** local journey + V1 booking sections + Sprint 17 money/confirmation rules + Phased Debrief state/recovery constraints.
   - **Preferences:** local glossary + V1 preference loop + master sprint 15 + Sprint 17 isolation rules.
   - **Trip workspace:** Phased Debrief phase one + V1 itinerary/dashboard sections; keep hotel/activity booking outside the local launch unless approved.
   - **Billing:** master sprints 12–13 + Phased Debrief membership/economics; first resolve price, entitlements and trials.
   - **Release review:** Sprint 17 + applicable Security checks + evidence of the actual end-to-end flow.
   - **Visual work:** Features screenshots + Design Library/Repos & Libraries + existing repo components; references do not mandate new dependencies.
   - **Positioning:** manifesto + Founder Intro Vid + Phased Debrief; substantiate supplier, savings and traction claims before using them publicly.
   - **B2B discovery:** Misc + Problems B2B section + master sprint group-inventory considerations; treat as a separate product investigation.
   - **Competitive research:** Competitors + Article Links as research starting points; verify external facts before drawing conclusions.
3. In the task brief, record the exact source links, extracted requirements, conflicts, exclusions, provider dependencies and tests that prove the requested behavior.
4. Check actual code and environment before trusting a historical status claim or command. For Next.js work, read the installed version's relevant guide under `node_modules/next/dist/docs/` as required by AGENTS.md.
5. When work is complete, update the task's implementation evidence and decisions. Refresh this index when Notion sources materially change; it is a dated snapshot.

Suggested next decision: choose whether the local first-flight journey remains the immediate delivery scope or is intentionally replaced by Phased Debrief phase one. Until then, reuse shared behavioral constraints while preserving the local scope.
