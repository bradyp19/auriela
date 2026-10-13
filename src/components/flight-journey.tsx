"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";
import { money } from "@/domain/money";
import {
  flightActionSchema,
  flightAirports,
  flightAirport,
  flightRequestSchema,
} from "@/flights/validation";
import type {
  FlightAction,
  FlightJourney,
  FlightSegment,
} from "@/flights/types";
import { SectionHeading } from "./ui";

async function snapshot(action?: FlightAction): Promise<FlightJourney | null> {
  const response = await fetch(
    "/api/flights",
    action
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
          cache: "no-store",
        }
      : { cache: "no-store" },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error ||
        "Flight service is unavailable. Refresh your saved journey.",
    );
  return result.journey;
}
function localTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}
function FlightLeg({
  title,
  segments,
}: {
  title: string;
  segments: FlightSegment[];
}) {
  return (
    <section className="flight-leg">
      <h3>{title}</h3>
      {segments.map((segment, index) => (
        <div
          key={`${segment.flightNumber}-${index}`}
          className="flight-segment"
        >
          <p>
            {segment.airline} · {segment.flightNumber} · {segment.cabin}
          </p>
          <div className="flight-segment-times">
            <div>
              <strong>{segment.origin}</strong>
              <span>{flightAirport(segment.origin)?.name}</span>
              <time dateTime={segment.departureAt}>
                {localTime(segment.departureAt, segment.departureTimeZone)}
              </time>
              <small>{segment.departureTimeZone}</small>
            </div>
            <Plane size={18} aria-hidden="true" />
            <div>
              <strong>{segment.destination}</strong>
              <span>{flightAirport(segment.destination)?.name}</span>
              <time dateTime={segment.arrivalAt}>
                {localTime(segment.arrivalAt, segment.arrivalTimeZone)}
              </time>
              <small>{segment.arrivalTimeZone}</small>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export function FlightReview({
  journey,
  busy,
  onAction,
}: {
  journey: FlightJourney;
  busy: boolean;
  onAction: (action: FlightAction) => void;
}) {
  const offer = journey.offer;
  const pending = journey.attempt?.status === "verification_pending";
  return (
    <section
      className="flight-review"
      aria-label="Flight offer and next action"
    >
      <p className="eyebrow">{journey.status.replaceAll("_", " ")}</p>
      {offer && (
        <>
          <h2>Review your flight</h2>
          <p>{offer.label}</p>
          <p className="flight-coverage">{offer.coverage}</p>
          <p>
            1 adult · {journey.request.cabin} · {journey.request.departureDate}
            {journey.request.returnDate
              ? ` → ${journey.request.returnDate}`
              : " · one-way"}
          </p>
          <FlightLeg title="Outbound" segments={offer.outbound} />
          {offer.return.length > 0 && (
            <FlightLeg title="Return" segments={offer.return} />
          )}
          <dl className="flight-price">
            <div>
              <dt>Base fare</dt>
              <dd>{money(offer.price.base)}</dd>
            </div>
            <div>
              <dt>Taxes</dt>
              <dd>{money(offer.price.taxes)}</dd>
            </div>
            <div>
              <dt>Mandatory fees</dt>
              <dd>{money(offer.price.mandatoryFees)}</dd>
            </div>
            <div className="flight-total">
              <dt>Total payable · USD</dt>
              <dd>{money(offer.price.total)}</dd>
            </div>
          </dl>
          <dl className="flight-terms">
            <div>
              <dt>Baggage</dt>
              <dd>{offer.baggage}</dd>
            </div>
            <div>
              <dt>Cancellation</dt>
              <dd>{offer.terms.cancellation}</dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>{offer.terms.changes}</dd>
            </div>
            <div>
              <dt>Offer expires</dt>
              <dd>
                <time dateTime={offer.expiresAt}>
                  {localTime(
                    offer.expiresAt,
                    offer.outbound[0].departureTimeZone,
                  )}
                </time>
              </dd>
            </div>
          </dl>
          <p className="flight-simulation">
            Simulated payment and reservation. No real ticket is issued and no
            money is taken.
          </p>
          {journey.status === "review" &&
            !journey.attempt &&
            journey.offerRevision && (
              <form
                key={JSON.stringify(offer)}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!journey.offerRevision) return;
                  onAction({
                    type: "approve",
                    journeyId: journey.id,
                    offerId: offer.id,
                    offerRevision: journey.offerRevision,
                    accepted: true,
                  });
                }}
              >
                <fieldset disabled={busy}>
                  <label className="checkbox-label">
                    <input type="checkbox" required name="accepted" />I accept
                    this exact itinerary, total price, baggage and fare terms.
                  </label>
                  <button className="button primary" type="submit">
                    Approve this offer
                  </button>
                </fieldset>
              </form>
            )}
          {journey.status === "approved" &&
            journey.approval?.offerId === offer.id &&
            journey.approval.offerRevision === journey.offerRevision &&
            !journey.attempt && (
              <>
                <p>
                  Approved. Checkout rechecks availability, price and terms. Any
                  change needs your approval again.
                </p>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    onAction({ type: "checkout", journeyId: journey.id })
                  }
                >
                  Continue to simulated checkout
                </button>
              </>
            )}
        </>
      )}
      {!offer && <h2>No matching offer to review</h2>}
      {journey.status === "unavailable" && (
        <p>This offer is unavailable or expired. Choose a new search.</p>
      )}
      {pending && (
        <div className="flight-outcome">
          <h3>Outcome still unknown</h3>
          <p>
            Verify the existing attempt before starting another purchase. A new
            search is locked while verification is pending.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => onAction({ type: "verify", journeyId: journey.id })}
          >
            Verify existing attempt
          </button>
        </div>
      )}
      {journey.attempt?.outcome && (
        <div className="flight-outcome">
          <h3>{journey.attempt.outcome.label}</h3>
          <p>{journey.attempt.outcome.message}</p>
          <dl className="flight-terms">
            {journey.attempt.outcome.supplierReference && (
              <div>
                <dt>Simulation reference</dt>
                <dd>{journey.attempt.outcome.supplierReference}</dd>
              </div>
            )}
            {journey.attempt.outcome.ticketReference && (
              <div>
                <dt>Simulation ticket reference</dt>
                <dd>{journey.attempt.outcome.ticketReference}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}

export function FlightJourneyView() {
  const [journey, setJourney] = useState<FlightJourney | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const locked = useRef(true);
  const feedback = useRef<HTMLDivElement>(null);
  async function run(action?: FlightAction) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      setJourney(await snapshot(action));
      setReady(true);
    } catch (failure) {
      setReady(false);
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not reach the flight service. Refresh your saved journey.",
      );
      if (action) {
        try {
          setJourney(await snapshot());
          setReady(true);
        } catch {
          /* Keep actions locked until the saved state can be read. */
        }
      }
    } finally {
      locked.current = false;
      setBusy(false);
      if (action) feedback.current?.focus();
    }
  }
  useEffect(() => {
    let active = true;
    snapshot()
      .then((value) => {
        if (active) {
          setJourney(value);
          setReady(true);
        }
      })
      .catch((failure) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load your saved journey.",
          );
      })
      .finally(() => {
        if (active) {
          locked.current = false;
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const action = flightActionSchema.safeParse({
      type: "request",
      scenario: data.get("scenario"),
      request: {
        origin: data.get("origin"),
        destination: data.get("destination"),
        departureDate: data.get("departureDate"),
        ...(data.get("returnDate")
          ? { returnDate: data.get("returnDate") }
          : {}),
        adults: 1,
        cabin: data.get("cabin"),
      },
    });
    if (!action.success || action.data.type !== "request") {
      setError("Choose supported airports, travel dates and cabin.");
      feedback.current?.focus();
      return;
    }
    const checked = flightRequestSchema().safeParse(action.data.request);
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      feedback.current?.focus();
      return;
    }
    void run(action.data);
  }
  function reminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!journey) return;
    const data = new FormData(event.currentTarget);
    const action = flightActionSchema.safeParse({
      type: "reminder",
      journeyId: journey.id,
      enabled: true,
      leadMinutes: Number(data.get("leadMinutes")),
      fallbackAccepted: data.get("fallbackAccepted") === "on",
    });
    if (!action.success) {
      setError(
        "Choose 1–1440 whole minutes and accept the airport-arrival fallback.",
      );
      feedback.current?.focus();
      return;
    }
    void run(action.data);
  }
  const disabled = busy || !ready;
  const pending = journey?.attempt?.status === "verification_pending";
  const requestLocked = Boolean(journey?.attempt);
  const complete =
    journey?.status === "simulated_complete" ||
    journey?.status === "verified_complete";
  return (
    <div className="flight-journey-shell">
      <a href="#flight-content" className="skip-link">
        Skip to flight journey
      </a>
      <header className="flight-journey-header">
        <Link href="/" className="wordmark">
          auriela<span className="wordmark-dot">.</span>
        </Link>
        <Link href="/app" className="button ghost">
          <ArrowLeft size={16} aria-hidden="true" />
          Your workspace
        </Link>
      </header>
      <main id="flight-content" className="flight-journey-main">
        <SectionHeading
          eyebrow="ONE JOURNEY, STEP BY STEP"
          title="Let’s find your flight."
        />
        <div className="flight-mode-notice">
          <Plane size={20} aria-hidden="true" />
          <p>
            <strong>Fixture mode · simulated flights only</strong>
            <br />
            No live airline search, payment or real ticket. One adult, supported
            US airports, economy or business.
          </p>
        </div>
        <div ref={feedback} tabIndex={-1} className="flight-feedback">
          <p role="status">
            {busy
              ? "Checking your saved flight journey…"
              : ready
                ? "Your latest flight journey is loaded."
                : "Load your saved flight journey to continue."}
          </p>
          {error && <p role="alert">{error}</p>}
        </div>
        <button
          className="button small"
          disabled={busy}
          onClick={() => void run()}
        >
          {ready
            ? "Refresh saved journey / check reminders"
            : "Retry loading saved journey"}
        </button>
        <div className="flight-journey-grid">
          <section
            className="flight-conversation"
            aria-labelledby="flight-conversation-title"
          >
            <h2 id="flight-conversation-title">Your flight conversation</h2>
            <ol
              className="flight-messages"
              aria-live="polite"
              aria-relevant="additions"
            >
              <li className="flight-message assistant">
                <strong>auriela</strong>
                <p>
                  Where are you flying? Choose your airports, travel dates and
                  cabin below. I’ll find the lowest total matching offer in the
                  simulated inventory for you to review.
                </p>
              </li>
              {journey?.messages.map((message) => (
                <li
                  key={message.id}
                  className={`flight-message ${message.role}`}
                >
                  <strong>{message.role === "user" ? "You" : "auriela"}</strong>
                  <p>{message.text}</p>
                </li>
              ))}
            </ol>
            <form
              onSubmit={search}
              key={journey?.id || "new"}
              className="flight-request-form"
            >
              <fieldset disabled={disabled || requestLocked}>
                <legend>
                  {journey
                    ? "Plan another flight"
                    : "Tell me about your flight"}
                </legend>
                <div className="flight-request-fields">
                  <label>
                    Origin airport
                    <select
                      name="origin"
                      required
                      defaultValue={journey?.request.origin || ""}
                    >
                      <option value="" disabled>
                        Choose origin
                      </option>
                      {flightAirports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.code} · {airport.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Destination airport
                    <select
                      name="destination"
                      required
                      defaultValue={journey?.request.destination || ""}
                    >
                      <option value="" disabled>
                        Choose destination
                      </option>
                      {flightAirports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.code} · {airport.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Departure date
                    <input
                      type="date"
                      name="departureDate"
                      required
                      defaultValue={journey?.request.departureDate}
                    />
                  </label>
                  <label>
                    Return date (optional)
                    <input
                      type="date"
                      name="returnDate"
                      defaultValue={journey?.request.returnDate}
                    />
                  </label>
                  <label>
                    Cabin
                    <select
                      name="cabin"
                      defaultValue={journey?.request.cabin || "economy"}
                    >
                      <option value="economy">Economy</option>
                      <option value="business">Business</option>
                    </select>
                  </label>
                  <label>
                    Traveler
                    <input value="1 adult" readOnly aria-readonly="true" />
                  </label>
                </div>
                <label>
                  Simulated test scenario
                  <select name="scenario" defaultValue="normal">
                    <option value="normal">Normal simulated completion</option>
                    <option value="price-change">
                      Price changes at checkout
                    </option>
                    <option value="terms-change">
                      Fare terms change at checkout
                    </option>
                    <option value="unavailable">
                      Offer becomes unavailable
                    </option>
                    <option value="uncertain">
                      Uncertain outcome · verify existing attempt
                    </option>
                  </select>
                </label>
                {!requestLocked && (
                  <p>
                    Submitting a new search replaces this saved journey. Choose
                    it when you’re ready to start again.
                  </p>
                )}
                <button type="submit" className="button primary">
                  Find a simulated flight
                </button>
              </fieldset>
              {requestLocked && (
                <p className="flight-simulation">
                  {pending
                    ? "Verify your existing attempt. Its booking record is retained."
                    : "This private sandbox retains one booking journey per browser session, including its reminder."}
                </p>
              )}
            </form>
          </section>
          <div className="flight-review-column">
            {journey ? (
              <FlightReview
                journey={journey}
                busy={disabled}
                onAction={(action) => void run(action)}
              />
            ) : (
              <section className="flight-review">
                <h2>Your itinerary will land here.</h2>
                <p>
                  First, choose where and when you want to go. Then review every
                  flight, fee and fare restriction before approving.
                </p>
              </section>
            )}
            {complete && journey && (
              <section className="flight-reminder">
                <h2>A reminder, on your terms.</h2>
                <p>
                  Opt in to an airport-arrival fallback before departure. Two
                  hours is a suggested fallback, not a leave-home calculation.
                </p>
                <p>
                  Reminders appear when this app next checks the server. No
                  closed-app push, SMS or WhatsApp notification is sent.
                </p>
                {journey.reminder?.enabled ? (
                  <>
                    <p role="status">
                      Reminder enabled · {journey.reminder.leadMinutes} minutes
                      before departure.
                      {journey.reminder.deliveredAt
                        ? " Delivered in your conversation."
                        : " Waiting for the next due server check."}
                    </p>
                    <button
                      className="button"
                      disabled={disabled}
                      onClick={() =>
                        void run({
                          type: "reminder",
                          journeyId: journey.id,
                          enabled: false,
                        })
                      }
                    >
                      Turn off reminder
                    </button>
                  </>
                ) : (
                  <form onSubmit={reminder}>
                    <fieldset disabled={disabled}>
                      <label>
                        Minutes before departure
                        <input
                          name="leadMinutes"
                          type="number"
                          min="1"
                          max="1440"
                          step="1"
                          required
                          defaultValue={journey.reminder?.leadMinutes || 120}
                        />
                      </label>
                      <label className="checkbox-label">
                        <input
                          name="fallbackAccepted"
                          type="checkbox"
                          required
                        />
                        I accept this airport-arrival fallback and in-app-only
                        delivery.
                      </label>
                      <button type="submit" className="button primary">
                        Enable in-app reminder
                      </button>
                    </fieldset>
                  </form>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
