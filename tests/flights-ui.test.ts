import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FlightReview } from "@/components/flight-journey";
import { createFixtureSupplier } from "@/flights/fixture";
import type { FlightJourney } from "@/flights/types";

const now = new Date("2026-10-13T12:00:00Z");
const request = {
  origin: "JFK",
  destination: "LAX",
  departureDate: "2026-10-20",
  returnDate: "2026-10-25",
  adults: 1 as const,
  cabin: "economy" as const,
};
const { offers } = await createFixtureSupplier({ now: () => now }).search(
  request,
);
const journey: FlightJourney = {
  id: "journey",
  request,
  scenario: "normal",
  mode: "fixture",
  status: "review",
  offer: offers[1],
  offerRevision: "current-revision",
  approval: null,
  attempt: null,
  messages: [],
  reminder: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};
const render = (state: FlightJourney) =>
  renderToStaticMarkup(
    createElement(FlightReview, {
      journey: state,
      busy: false,
      onAction: () => {},
    }),
  );

describe("visible flight review", () => {
  it("shows the complete return journey, payable total and terms before explicit consent", () => {
    const html = render(journey);
    for (const text of [
      "Outbound",
      "Return",
      "America/New_York",
      "America/Los_Angeles",
      "$480",
      "Taxes",
      "Mandatory fees",
      "Cancellation",
      "Changes",
      "Baggage",
      "No real ticket",
      'required=""',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("Continue to simulated checkout");
  });
  it("offers checkout only when approval matches the exact current revision", () => {
    const approved: FlightJourney = {
      ...journey,
      status: "approved",
      approval: {
        offerId: journey.offer!.id,
        offerRevision: "current-revision",
        approvedAt: now.toISOString(),
      },
    };
    expect(render(approved)).toContain("Continue to simulated checkout");
    expect(
      render({
        ...approved,
        approval: { ...approved.approval!, offerRevision: "stale-revision" },
      }),
    ).not.toContain("Continue to simulated checkout");
  });
  it("does not offer approval without a server snapshot revision", () => {
    expect(render({ ...journey, offerRevision: null })).not.toContain(
      "Approve this offer",
    );
  });
  it("offers existing-attempt verification instead of another purchase", () => {
    const html = render({
      ...journey,
      status: "verification_pending",
      attempt: {
        id: "attempt",
        status: "verification_pending",
        startedAt: now.toISOString(),
        outcome: null,
      },
    });
    expect(html).toContain("Verify existing attempt");
    expect(html).not.toContain("Continue to simulated checkout");
    expect(html).not.toContain("Approve this offer");
  });
});
