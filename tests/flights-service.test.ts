import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FlightRepository } from "@/flights/repository";
import { FlightService } from "@/flights/service";
import { createFixtureSupplier } from "@/flights/fixture";
import type {
  FlightRequest,
  FixtureScenario,
  SupplierOutcome,
} from "@/flights/types";
import type { FlightSupplier } from "@/flights/supplier";

const request: FlightRequest = {
  origin: "JFK",
  destination: "LAX",
  departureDate: "2026-10-14",
  adults: 1,
  cabin: "economy",
};
const resources: { directory: string; repositories: FlightRepository[] }[] = [];
function setup(transform?: (supplier: FlightSupplier) => FlightSupplier) {
  const directory = mkdtempSync(join(tmpdir(), "flight-service-"));
  const path = join(directory, "journeys.sqlite");
  let instant = new Date("2026-10-13T16:00:00Z");
  const now = () => instant;
  const resource = { directory, repositories: [] as FlightRepository[] };
  resources.push(resource);
  const open = () => {
    const repository = new FlightRepository(path);
    resource.repositories.push(repository);
    const factory = (scenario: FixtureScenario) => {
      const supplier = createFixtureSupplier({ scenario, now });
      return transform ? transform(supplier) : supplier;
    };
    return { repository, service: new FlightService(repository, factory, now) };
  };
  return {
    ...open(),
    path,
    open,
    now,
    setTime: (value: string) => {
      instant = new Date(value);
    },
  };
}
afterEach(() => {
  for (const resource of resources.splice(0)) {
    for (const repository of resource.repositories) repository.close();
    rmSync(resource.directory, { recursive: true, force: true });
  }
});
async function approved(
  service: FlightService,
  scenario: FixtureScenario = "normal",
) {
  const journey = await service.act("session-a", {
    type: "request",
    request,
    scenario,
  });
  return service.act("session-a", {
    type: "approve",
    journeyId: journey.id,
    offerId: journey.offer!.id,
    offerRevision: journey.offerRevision!,
    accepted: true,
  });
}

describe("durable flight approval", () => {
  it("restricts persisted journey files to the current OS user", async () => {
    const test = setup();
    await approved(test.service);
    expect(statSync(test.path).mode & 0o777).toBe(0o600);
    expect(statSync(`${test.path}-wal`).mode & 0o777).toBe(0o600);
  });
  it("keeps the validated request immutable across supplier calls", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async search(input) {
        input.destination = "SFO";
        return supplier.search(input);
      },
    }));
    const journey = await service.act("session-a", {
      type: "request",
      request,
    });
    expect(journey.request.destination).toBe("LAX");
    expect(journey.offer).toBeNull();
  });
  it("restores exact offer, approval and messages after close/reopen", async () => {
    const test = setup();
    const journey = await approved(test.service);
    expect(journey.offer!.price.total).toBe(24000);
    expect(journey.status).toBe("approved");
    test.repository.close();
    expect(await test.open().service.get("session-a")).toEqual(journey);
  });
  it.each(["price-change", "terms-change"] as const)(
    "requires fresh approval after %s",
    async (scenario) => {
      const { service } = setup();
      const old = await approved(service, scenario);
      const changed = await service.act("session-a", {
        type: "checkout",
        journeyId: old.id,
      });
      expect(changed.status).toBe("review");
      expect(changed.approval).toBeNull();
      expect(changed.attempt).toBeNull();
      expect(changed.offer).not.toEqual(old.offer);
      await expect(
        service.act("session-a", { type: "checkout", journeyId: old.id }),
      ).rejects.toThrow(/approv/i);
      await service.act("session-a", {
        type: "approve",
        journeyId: changed.id,
        offerId: changed.offer!.id,
        offerRevision: changed.offerRevision!,
        accepted: true,
      });
      expect(
        (
          await service.act("session-a", {
            type: "checkout",
            journeyId: changed.id,
          })
        ).status,
      ).toBe("simulated_complete");
    },
  );
  it("requires review when itinerary changes with the same offer ID", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async refresh(offer) {
        return {
          mode: "fixture",
          label: offer.label,
          status: "available",
          offer: {
            ...offer,
            outbound: [{ ...offer.outbound[0], flightNumber: "FX999" }],
          },
        };
      },
    }));
    const old = await approved(service);
    const changed = await service.act("session-a", {
      type: "checkout",
      journeyId: old.id,
    });
    expect(changed.status).toBe("review");
    expect(changed.offer!.outbound[0].flightNumber).toBe("FX999");
    expect(changed.approval).toBeNull();
  });
  it.each(["expired", "unavailable", "departed"])(
    "blocks checkout for %s offers",
    async (kind) => {
      let purchases = 0;
      const test = setup((supplier) => ({
        ...supplier,
        async checkout(offer, id) {
          purchases++;
          return supplier.checkout(offer, id);
        },
      }));
      const journey = await approved(
        test.service,
        kind === "unavailable" ? "unavailable" : "normal",
      );
      if (kind === "expired") test.setTime("2026-10-13T16:15:00Z");
      if (kind === "departed") test.setTime("2026-10-14T11:00:00Z");
      expect(
        (
          await test.service.act("session-a", {
            type: "checkout",
            journeyId: journey.id,
          })
        ).status,
      ).toBe("unavailable");
      expect(purchases).toBe(0);
    },
  );
  it("isolates sessions and rejects stale journey and approval IDs", async () => {
    const { service } = setup();
    const first = await approved(service);
    expect(await service.get("session-b")).toBeNull();
    for (const action of [
      { type: "checkout", journeyId: first.id },
      { type: "verify", journeyId: first.id },
      {
        type: "approve",
        journeyId: first.id,
        offerId: first.offer!.id,
        offerRevision: first.offerRevision!,
        accepted: true,
      },
      { type: "reminder", journeyId: first.id, enabled: false },
    ] as const)
      await expect(service.act("session-b", action)).rejects.toThrow();
    await expect(
      service.act("session-a", {
        type: "approve",
        journeyId: first.id,
        offerId: "forged",
        offerRevision: first.offerRevision!,
        accepted: true,
      }),
    ).rejects.toThrow();
    await service.act("session-a", { type: "request", request });
    await expect(
      service.act("session-a", { type: "checkout", journeyId: first.id }),
    ).rejects.toThrow();
  });
});

describe("durable booking attempts", () => {
  it("keeps malformed completion pending even with references", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async checkout() {
        return {
          mode: "fixture",
          status: "simulated_complete",
          supplierReference: "fixture-order",
          ticketReference: "fixture-ticket",
        } as SupplierOutcome;
      },
    }));
    const journey = await approved(service);
    expect(
      (
        await service.act("session-a", {
          type: "checkout",
          journeyId: journey.id,
        })
      ).status,
    ).toBe("verification_pending");
  });
  it("retains supplier recovery references when later verification fails", async () => {
    const test = setup((supplier) => ({
      ...supplier,
      async verify() {
        throw new Error("SECRET");
      },
    }));
    const journey = await approved(test.service, "uncertain");
    const pending = await test.service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    expect(pending.attempt!.outcome!.supplierReference).toBeTruthy();
    const verified = await test.service.act("session-a", {
      type: "verify",
      journeyId: journey.id,
    });
    expect(verified.status).toBe("verification_pending");
    expect(verified.attempt!.outcome!.supplierReference).toBe(
      pending.attempt!.outcome!.supplierReference,
    );
    test.repository.close();
    expect(
      (await test.open().service.get("session-a"))!.attempt!.outcome!
        .supplierReference,
    ).toBe(pending.attempt!.outcome!.supplierReference);
  });
  it("commits one attempt before checkout across two database connections", async () => {
    let purchases = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const test = setup((supplier) => ({
      ...supplier,
      async checkout(offer, id) {
        purchases++;
        const stored = test.open().repository.load("session-a")!;
        expect(stored.attempt?.id).toBe(id);
        expect(stored.status).toBe("verification_pending");
        await gate;
        return supplier.checkout(offer, id);
      },
    }));
    const journey = await approved(test.service);
    const second = test.open().service;
    const first = test.service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    const repeated = await second.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    expect(repeated.attempt?.status).toBe("verification_pending");
    expect(purchases).toBe(1);
    await expect(
      second.act("session-a", { type: "request", request }),
    ).rejects.toThrow(/verif/i);
    release();
    const complete = await first;
    expect(complete.status).toBe("simulated_complete");
    expect(complete.attempt!.id).toBe(repeated.attempt!.id);
    expect(
      (
        await second.act("session-a", {
          type: "checkout",
          journeyId: journey.id,
        })
      ).attempt!.id,
    ).toBe(complete.attempt!.id);
    expect(purchases).toBe(1);
  });
  it("keeps unknown checkout pending after restart and verifies the same attempt", async () => {
    let verificationId: string | undefined;
    const test = setup((supplier) => ({
      ...supplier,
      async checkout() {
        throw new Error("SECRET supplier timeout");
      },
      async verify(id) {
        verificationId = id;
        return supplier.verify(id);
      },
    }));
    const journey = await approved(test.service);
    const pending = await test.service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    expect(pending.status).toBe("verification_pending");
    expect(JSON.stringify(pending)).not.toContain("SECRET");
    test.repository.close();
    const restored = test.open().service;
    expect((await restored.get("session-a"))!.attempt!.id).toBe(
      pending.attempt!.id,
    );
    await expect(
      restored.act("session-a", { type: "request", request }),
    ).rejects.toThrow(/verif/i);
    const verified = await restored.act("session-a", {
      type: "verify",
      journeyId: journey.id,
    });
    expect(verificationId).toBe(pending.attempt!.id);
    expect(verified.status).toBe("simulated_complete");
    expect(verified.messages.at(-1)!.text).toMatch(
      /simulated.*no.*real ticket/i,
    );
  });
  it.each([undefined, "payment-only"])(
    "requires supplier and ticket evidence before sandbox completion (%s)",
    async (reference) => {
      const test = setup((fixture) => ({
        ...fixture,
        mode: "sandbox",
        async search(input) {
          const result = await fixture.search(input);
          return {
            ...result,
            mode: "sandbox",
            label: "Sandbox",
            offers: result.offers.map((offer) => ({
              ...offer,
              mode: "sandbox",
              label: "Sandbox",
            })),
          };
        },
        async refresh(offer) {
          return {
            mode: "sandbox",
            label: "Sandbox",
            status: "available",
            offer,
          };
        },
        async checkout() {
          return {
            mode: "sandbox",
            status: "verified_complete",
            label: "Sandbox",
            message: "Payment received",
            supplierReference: reference,
          };
        },
      }));
      const journey = await approved(test.service);
      const pending = await test.service.act("session-a", {
        type: "checkout",
        journeyId: journey.id,
      });
      expect(pending.status).toBe("verification_pending");
    },
  );
  it("projects outcome fields and ignores supplier text/secrets", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async checkout(offer, id) {
        return {
          ...(await supplier.checkout(offer, id)),
          secretKey: "SECRET",
          message: "SECRET raw provider data",
          label: "SECRET",
        };
      },
    }));
    const journey = await approved(service);
    const complete = await service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    expect(complete.status).toBe("simulated_complete");
    expect(JSON.stringify(complete)).not.toContain("SECRET");
  });
  it("treats malformed or mode-mismatched outcomes as unknown without repeat purchases", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async checkout() {
        return {
          status: "verified_complete",
          mode: "sandbox",
        } as SupplierOutcome;
      },
    }));
    const journey = await approved(service);
    expect(
      (
        await service.act("session-a", {
          type: "checkout",
          journeyId: journey.id,
        })
      ).status,
    ).toBe("verification_pending");
    await expect(
      service.act("session-a", { type: "request", request }),
    ).rejects.toThrow();
  });
});

describe("supplier validation and opted-in reminders", () => {
  it("rejects malformed refresh without an attempt or exposing provider errors", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async refresh(offer) {
        return {
          mode: "fixture",
          label: offer.label,
          status: "available",
          offer: { ...offer, price: { ...offer.price, total: 1 } },
        };
      },
    }));
    const journey = await approved(service);
    await expect(
      service.act("session-a", { type: "checkout", journeyId: journey.id }),
    ).rejects.toThrow(/supplier/i);
    expect((await service.get("session-a"))!.attempt).toBeNull();
  });
  it("rejects request-mismatched refresh even when independently valid", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async refresh(offer) {
        const result = await supplier.search({
          ...request,
          destination: "SFO",
        });
        return {
          mode: "fixture",
          label: offer.label,
          status: "available",
          offer: result.offers[0],
        };
      },
    }));
    const journey = await approved(service);
    await expect(
      service.act("session-a", { type: "checkout", journeyId: journey.id }),
    ).rejects.toThrow();
  });
  it("rejects malformed search and invalid actions at the service boundary", async () => {
    const { service } = setup((supplier) => ({
      ...supplier,
      async search() {
        return { mode: "fixture", offers: null } as never;
      },
    }));
    await expect(
      service.act("session-a", { type: "request", request }),
    ).rejects.toThrow(/supplier/i);
    await expect(
      service.act("session-a", {
        type: "request",
        request: { ...request, adults: 2 } as unknown as FlightRequest,
      }),
    ).rejects.toThrow();
  });
  it("requires completion, opt-in and accepted fallback, delivers due reminder once across connections", async () => {
    const test = setup();
    const journey = await approved(test.service);
    const action = {
      type: "reminder",
      journeyId: journey.id,
      enabled: true,
      leadMinutes: 120,
      fallbackAccepted: true,
    } as const;
    await expect(test.service.act("session-a", action)).rejects.toThrow();
    const complete = await test.service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    expect(complete.reminder).toBeNull();
    await expect(
      test.service.act("session-a", {
        ...action,
        fallbackAccepted: false,
      } as never),
    ).rejects.toThrow();
    const enabled = await test.service.act("session-a", action);
    expect(enabled.reminder!.dueAt).toBe("2026-10-14T08:00:00.000Z");
    test.setTime("2026-10-14T08:00:00Z");
    const [first, second] = await Promise.all([
      test.service.get("session-a"),
      test.open().service.get("session-a"),
    ]);
    expect(first!.messages).toHaveLength(enabled.messages.length + 1);
    expect(second!.messages).toHaveLength(enabled.messages.length + 1);
    expect(first!.reminder!.deliveredAt).toBe("2026-10-14T08:00:00.000Z");
    expect(first!.messages.at(-1)!.text).toMatch(/fallback/i);
    expect((await test.service.act("session-a", action)).messages).toHaveLength(
      first!.messages.length,
    );
    test.repository.close();
    expect((await test.open().service.get("session-a"))!.messages).toHaveLength(
      first!.messages.length,
    );
  });
});

describe("approval revision and booking retention regressions", () => {
  it.each(["price", "segments", "baggage", "terms", "expired-price"] as const)(
    "rejects stale same-ID approval after changed %s",
    async (field) => {
      const { service } = setup((supplier) => ({
        ...supplier,
        async refresh(offer) {
          return {
            mode: "fixture",
            label: offer.label,
            status: "available",
            offer: {
              ...offer,
              ...(field === "price" || field === "expired-price"
                ? {
                    price: {
                      ...offer.price,
                      base: offer.price.base + 10000,
                      total: offer.price.total + 10000,
                    },
                  }
                : {}),
              ...(field === "expired-price"
                ? { expiresAt: "2026-10-13T15:00:00.000Z" }
                : {}),
              ...(field === "segments"
                ? {
                    outbound: [{ ...offer.outbound[0], flightNumber: "FX999" }],
                  }
                : {}),
              ...(field === "baggage"
                ? { baggage: "No checked bag included" }
                : {}),
              ...(field === "terms"
                ? {
                    terms: {
                      ...offer.terms,
                      cancellation: "No cancellation permitted",
                    },
                  }
                : {}),
            },
          };
        },
      }));
      const old = await approved(service);
      const changed = await service.act("session-a", {
        type: "checkout",
        journeyId: old.id,
      });
      expect(changed.offer!.id).toBe(old.offer!.id);
      expect(changed.status).toBe(
        field === "expired-price" ? "unavailable" : "review",
      );
      expect(changed.offerRevision).not.toBe(old.offerRevision);
      await expect(
        service.act("session-a", {
          type: "approve",
          journeyId: old.id,
          offerId: old.offer!.id,
          offerRevision: old.offerRevision!,
          accepted: true,
        }),
      ).rejects.toThrow(/review/i);
      expect((await service.get("session-a"))!.approval).toBeNull();
      if (field !== "expired-price") {
        const fresh = await service.act("session-a", {
          type: "approve",
          journeyId: changed.id,
          offerId: changed.offer!.id,
          offerRevision: changed.offerRevision!,
          accepted: true,
        });
        expect(fresh.approval!.offerRevision).toBe(changed.offerRevision);
        expect(
          (
            await service.act("session-a", {
              type: "checkout",
              journeyId: changed.id,
            })
          ).status,
        ).toBe(field === "price" ? "review" : "simulated_complete");
      }
    },
  );
  it("retains completed booking and delivers its accepted reminder once after rejected search and restart", async () => {
    const test = setup();
    const journey = await approved(test.service);
    await test.service.act("session-a", {
      type: "checkout",
      journeyId: journey.id,
    });
    const enabled = await test.service.act("session-a", {
      type: "reminder",
      journeyId: journey.id,
      enabled: true,
      leadMinutes: 120,
      fallbackAccepted: true,
    });
    await expect(
      test.service.act("session-a", { type: "request", request }),
    ).rejects.toThrow();
    expect(await test.service.get("session-a")).toEqual(enabled);
    test.repository.close();
    const restored = test.open().service;
    test.setTime("2026-10-14T08:00:00Z");
    const delivered = (await restored.get("session-a"))!;
    expect(delivered.attempt).toEqual(enabled.attempt);
    expect(delivered.offer).toEqual(enabled.offer);
    expect(delivered.approval).toEqual(enabled.approval);
    expect(delivered.messages.slice(0, -1)).toEqual(enabled.messages);
    expect(delivered.reminder!.deliveredAt).toBe("2026-10-14T08:00:00.000Z");
    expect((await test.open().service.get("session-a"))!.messages).toHaveLength(
      enabled.messages.length + 1,
    );
  });
});

it("requires fresh review for legacy unattempted approval without a revision", async () => {
  const test = setup();
  const old = await approved(test.service);
  test.repository.update("session-a", (current) => {
    delete (current as unknown as Record<string, unknown>).offerRevision;
    delete (current!.approval as unknown as Record<string, unknown>)
      .offerRevision;
    return current;
  });
  test.repository.close();
  const service = test.open().service;
  await expect(
    service.act("session-a", { type: "checkout", journeyId: old.id }),
  ).rejects.toThrow(/approv/i);
  const current = (await service.get("session-a"))!;
  expect(current.status).toBe("review");
  expect(current.approval).toBeNull();
});

it("rejects missing, false and forged revisions at the service boundary", async () => {
  const { service } = setup();
  const journey = await service.act("session-a", { type: "request", request });
  for (const offerRevision of [undefined, false, "forged"]) {
    await expect(
      service.act("session-a", {
        type: "approve",
        journeyId: journey.id,
        offerId: journey.offer!.id,
        offerRevision,
        accepted: true,
      } as never),
    ).rejects.toThrow();
  }
  expect((await service.get("session-a"))!.approval).toBeNull();
});
it("retains terminal failed attempts when another search is requested", async () => {
  const { service } = setup((supplier) => ({
    ...supplier,
    async checkout() {
      return {
        mode: "fixture",
        status: "failed",
        label: "Fixture",
        message: "Failed",
      };
    },
  }));
  const journey = await approved(service);
  const failed = await service.act("session-a", {
    type: "checkout",
    journeyId: journey.id,
  });
  expect(failed.status).toBe("failed");
  await expect(
    service.act("session-a", { type: "request", request }),
  ).rejects.toThrow();
  expect(await service.get("session-a")).toEqual(failed);
});
