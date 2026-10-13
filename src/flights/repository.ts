import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { FlightJourney } from "./types";

export class FlightRepository {
  private readonly database: DatabaseSync;
  private closed = false;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.database.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS flight_journeys (
        session_id TEXT PRIMARY KEY,
        journey TEXT NOT NULL
      );
    `);
  }

  load(sessionId: string): FlightJourney | null {
    const row = this.database
      .prepare("SELECT journey FROM flight_journeys WHERE session_id = ?")
      .get(sessionId);
    return row ? (JSON.parse(row.journey as string) as FlightJourney) : null;
  }

  update(
    sessionId: string,
    change: (current: FlightJourney | null) => FlightJourney | null,
  ): FlightJourney | null {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const journey = change(this.load(sessionId));
      if (journey)
        this.database
          .prepare(
            "INSERT INTO flight_journeys(session_id, journey) VALUES (?, ?) ON CONFLICT(session_id) DO UPDATE SET journey = excluded.journey",
          )
          .run(sessionId, JSON.stringify(journey));
      this.database.exec("COMMIT");
      return journey;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    if (!this.closed) {
      this.database.close();
      this.closed = true;
    }
  }
}
