import { describe, expect, it } from "vitest";
import type { FlightRequest } from "@/flights/types";

import * as validation from "@/flights/validation";
import * as fixture from "@/flights/fixture";
const now = new Date("2026-10-13T16:00:00Z");
const request: FlightRequest = {
  origin: "JFK",
  destination: "LAX",
  departureDate: "2026-10-13",
  adults: 1,
  cabin: "economy",
};
const parseRequest = (value: unknown) => {
  return validation.flightRequestSchema(now).safeParse(value);
};
const supplier = (
  scenario:
    | "normal"
    | "price-change"
    | "terms-change"
    | "unavailable"
    | "uncertain" = "normal",
) => {
  return fixture.createFixtureSupplier({ now: () => now, scenario });
};

describe("flight request trust boundary", () => {
  it("accepts a same-day one-way and preserves actual round-trip dates", () => {
    expect(parseRequest(request).success).toBe(true);
    const result = parseRequest({
      ...request,
      returnDate: "2026-10-13",
      cabin: "business",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.returnDate).toBe("2026-10-13");
  });
  it.each([
    { departureDate: "2026-02-30" },
    { departureDate: "2026-10-12" },
    { departureDate: "2027-02-29" },
    { returnDate: "2026-02-30" },
    { departureDate: "2026-10-15", returnDate: "2026-10-14" },
    { origin: "ZZZ" },
    { destination: "LHR" },
    { destination: "JFK" },
    { adults: 2 },
    { adults: 0 },
    { adults: "1" },
    { cabin: "first" },
    { arbitraryPrice: 1 },
    { departureDate: "October 13, 2026" },
  ])("rejects invalid request %j", (change) =>
    expect(parseRequest({ ...request, ...change }).success).toBe(false),
  );
  it("uses origin local calendar day across UTC midnight", () => {
    expect(
      validation
        .flightRequestSchema(new Date("2026-10-14T01:00:00Z"))
        .safeParse(request).success,
    ).toBe(true);
    expect(
      validation
        .flightRequestSchema(new Date("2026-10-14T05:00:00Z"))
        .safeParse(request).success,
    ).toBe(false);
  });
  it("accepts future dates outside the November demo window", () =>
    expect(
      parseRequest({
        ...request,
        departureDate: "2028-02-29",
        returnDate: "2028-03-04",
      }).success,
    ).toBe(true));
});

describe("complete offers and fixture boundary", () => {
  it("preserves outbound and actual reversed return segments with local zones", async () => {
    const result = await supplier().search({
      ...request,
      returnDate: "2026-10-14",
    });
    expect(result.mode).toBe("fixture");
    expect(result.label).toContain("Simulated");
    expect(result.coverage).toContain("fixture");
    const offer = result.offers[0];
    expect(offer.outbound[0]).toMatchObject({
      origin: "JFK",
      destination: "LAX",
      departureTimeZone: "America/New_York",
      arrivalTimeZone: "America/Los_Angeles",
    });
    expect(offer.return[0]).toMatchObject({
      origin: "LAX",
      destination: "JFK",
    });
    expect(offer.outbound[0].departureAt.slice(0, 10)).toBe("2026-10-13");
    expect(offer.return[0].departureAt.slice(0, 10)).toBe("2026-10-14");
    expect(offer.price.total).toBe(
      offer.price.base + offer.price.taxes + offer.price.mandatoryFees,
    );
    expect(offer.terms.cancellation).toBeTruthy();
    expect(offer.terms.changes).toBeTruthy();
  });
  it("handles DST, Hawaii and same-day returns with chronological complete segments", async () => {
    for (const value of [
      { ...request, destination: "HNL", departureDate: "2027-03-14" },
      { ...request, returnDate: "2026-10-13" },
    ]) {
      const { offers } = await supplier().search(value);
      expect(offers).toHaveLength(3);
      for (const offer of offers)
        expect(validation.flightOfferSchema.safeParse(offer).success).toBe(
          true,
        );
      if (value.returnDate)
        expect(Date.parse(offers[0].return[0].departureAt)).toBeGreaterThan(
          Date.parse(offers[0].outbound.at(-1)!.arrivalAt),
        );
    }
  });
  it("chooses the lowest matching complete payable offer and excludes cheaper wrong inventory", async () => {
    const { offers } = await supplier().search(request);
    const wrong = {
      ...offers[0],
      id: "wrong",
      request: { ...request, cabin: "business" },
      price: { currency: "USD", base: 1, taxes: 0, mandatoryFees: 0, total: 1 },
    };
    expect(
      validation.lowestMatchingOffer(request, [wrong, ...offers], now)?.price
        .total,
    ).toBe(24000);
    expect(
      validation.lowestMatchingOffer(
        request,
        offers.map((offer) => ({ ...offer, expiresAt: now.toISOString() })),
        now,
      ),
    ).toBeNull();
  });
  it("rejects missing mandatory total, unknown restrictions, altered segments and incomplete returns", async () => {
    const { offers } = await supplier().search({
      ...request,
      returnDate: "2026-10-14",
    });
    const offer = offers[0];
    const invalid = [
      { ...offer, price: { ...offer.price, total: undefined } },
      { ...offer, price: { ...offer.price, total: 1 } },
      { ...offer, terms: { cancellation: "Unknown", changes: "" } },
      { ...offer, terms: { cancellation: null, changes: "Unknown" } },
      { ...offer, outbound: [{ ...offer.outbound[0], destination: "SFO" }] },
      { ...offer, return: [] },
      { ...offer, return: [{ ...offer.return[0], departureTimeZone: "UTC" }] },
    ];
    for (const value of invalid)
      expect(validation.flightOfferSchema.safeParse(value).success).toBe(false);
  });
  it("rejects malformed provider offers without throwing at the trust boundary", async () => {
    const { offers } = await supplier().search({
      ...request,
      returnDate: "2026-10-14",
    });
    const offer = offers[0];
    for (const value of [
      { ...offer, outbound: [] },
      { ...offer, outbound: [{ ...offer.outbound[0], departureAt: "bad" }] },
      { ...offer, outbound: [{ ...offer.outbound[0], origin: "ZZZ" }] },
      { ...offer, label: "Real purchased ticket" },
    ])
      expect(validation.flightOfferSchema.safeParse(value).success).toBe(false);
  });
  it("keeps price and terms changes distinct and reports unavailability", async () => {
    const { offers } = await supplier().search(request);
    const offer = offers[0];
    const price = await supplier("price-change").refresh(offer);
    expect(price.status).toBe("available");
    if (price.status === "available")
      expect(price.offer.price.total).toBe(offer.price.total + 3500);
    const terms = await supplier("terms-change").refresh(offer);
    if (terms.status === "available") {
      expect(terms.offer.price.total).toBe(offer.price.total);
      expect(terms.offer.terms).not.toEqual(offer.terms);
    }
    expect((await supplier("unavailable").refresh(offer)).status).toBe(
      "unavailable",
    );
  });
  it("rejects checkout after departure even when the offer has not expired", async () => {
    let instant = new Date("2026-10-13T16:59:00Z");
    const adapter = fixture.createFixtureSupplier({ now: () => instant });
    const { offers } = await adapter.search(request);
    expect(offers[0].outbound[0].departureAt).toBe("2026-10-13T13:00:00-04:00");
    expect(offers[0].expiresAt).toBe("2026-10-13T17:14:00.000Z");
    instant = new Date("2026-10-13T17:01:00Z");
    expect(await adapter.checkout(offers[0], "departed-attempt")).toMatchObject(
      { mode: "fixture", status: "failed" },
    );
  });
  it("returns honest simulated completion and reconciles uncertain attempts after adapter restart", async () => {
    const { offers } = await supplier().search(request);
    const completion = await supplier().checkout(offers[0], "attempt-1");
    expect(completion).toMatchObject({
      mode: "fixture",
      status: "simulated_complete",
    });
    expect(completion.label).toContain("Simulated");
    const pending = await supplier("uncertain").checkout(
      offers[0],
      "attempt-2",
    );
    expect(pending.status).toBe("verification_pending");
    const verified = await supplier("uncertain").verify("attempt-2");
    expect(verified.status).toBe("simulated_complete");
    expect(verified.supplierReference).toBe("fixture-attempt-2");
    expect(await supplier().checkout(offers[0], "attempt-1")).toEqual(
      completion,
    );
  });
});

describe("strict flight action contracts", () => {
  const action = (value: unknown) => {
    return validation.flightActionSchema.safeParse(value).success;
  };
  it("accepts explicit approval and accepted fallback reminder", () => {
    expect(
      action({
        type: "approve",
        journeyId: "journey-1",
        offerId: "offer-1",
        accepted: true,
      }),
    ).toBe(true);
    expect(
      action({
        type: "reminder",
        journeyId: "journey-1",
        enabled: true,
        leadMinutes: 120,
        fallbackAccepted: true,
      }),
    ).toBe(true);
    expect(
      action({ type: "reminder", journeyId: "journey-1", enabled: false }),
    ).toBe(true);
    expect(action({ type: "request", request })).toBe(true);
  });
  it.each([
    { type: "approve", journeyId: "j", offerId: "o" },
    { type: "approve", journeyId: "j", offerId: "o", accepted: false },
    { type: "checkout", journeyId: "j", total: 1 },
    { type: "verify", journeyId: "j", status: "verified_complete" },
    { type: "reminder", journeyId: "j", enabled: true, leadMinutes: 120 },
    {
      type: "reminder",
      journeyId: "j",
      enabled: true,
      leadMinutes: -1,
      fallbackAccepted: true,
    },
  ])("rejects unsafe action %j", (value) => expect(action(value)).toBe(false));
});
