# First flight journey

## Agreed scope

- Customer: a frequent traveler arranging their own business and leisure travel, with saved preferences.
- First complete journey: flight request → suitable offer → traveler approval → confirmed booking → departure reminder.
- Flight scope: one adult, US domestic, one-way or round-trip, economy or business class.
- Launch channels: SMS-style messaging and WhatsApp. Secure links collect personal or payment information when needed; the web travel workspace is secondary.
- Booking model (agreed October 13, 2026): embedded supplier booking. Travelers approve and complete the purchase within Aurelia's flow, with supplier-managed payment and ticketing. Aurelia coordinates the request, approval and confirmation experience. The purpose is ease of use; improved acquisition and engagement remain a product hypothesis to validate.
- Purchase authority: the traveler approves the specific itinerary, total price, and cancellation terms before money is committed. A request to “book” alone is insufficient.
- Changed offers: changes to the approved itinerary, price, or cancellation terms require fresh approval.
- Uncertain booking outcomes: tell the traveler verification is in progress, and verify the outcome before attempting another purchase. Report confirmation only after successful completion has been confirmed.
- Later capabilities: accommodation booking, automatic fare monitoring/rebooking, richer flight ranking, and alternative-flight suggestions.
- Request clarification: use details reliably available from the request and saved profile; ask for unresolved details, and show resolved dates and airports before approval.
- Launch recommendation priority: accurately recommend the lowest total payable price among matching flights returned by Aurelia's connected suppliers. This is a scoped search promise, not a claim to cover every airline or booking site.
- Price transparency: show a price breakdown with the recommended flight, including mandatory taxes and fees and explicitly requested extras, alongside the exact itinerary and fare restrictions.
- Offer freshness: recheck price and availability before purchase. Changes to the approved price or terms require fresh approval.
- Later recommendation experience: lead with one recommended flight and present up to two alternatives when useful. Alternatives may use other airlines or depart outside the requested time window; make those differences explicit. Multi-factor ranking is deferred.
- Preferences: saved preferences guide recommendations; explicit requirements determine whether an offer qualifies. Ask which requirement to relax when no qualifying offer exists.
- Preference learning: Aurelia should learn the traveler's preferences over time. Inferred preferences remain soft, explainable, and correctable; only an explicit traveler instruction makes one a requirement. Delivery timing for learning remains open.
- Departure reminders: traveler-enabled, with a suggested leave-home time based on a confirmed departure location and available travel information. Explain missing or stale information and let the traveler choose a clearly labeled fallback.

## Decisions still open

- Supplier selection and searchable inventory coverage.
- Delivery timing and mechanisms for learning and correcting preferences.
- Departure reminder timing and information sources.
- Supplier account approval, merchant-of-record and funding arrangements for embedded booking, and direct supplier versus Aurelia-relayed traveler support.
- Delivery deadline, existing customers/data, and operating constraints.
- Identity and preferences across messaging channels.

These are product decisions from the architecture interview, not descriptions of implemented capabilities. The current checkout remains a local demonstration.
