import 'server-only';
import { FlightError } from './errors';
import { createFixtureSupplier } from './fixture';
import { FlightRepository } from './repository';
import { FlightService } from './service';

let server: { repository: FlightRepository; service: FlightService } | undefined;
export function flightServer() {
  if (process.env.AURELIA_FLIGHT_MODE && process.env.AURELIA_FLIGHT_MODE !== 'fixture') {
    throw new FlightError('Supplier checkout is not enabled. Use fixture mode until sandbox access and ticket verification are established.', 503);
  }
  if (!server) {
    const repository = new FlightRepository(process.env.AURELIA_DB_PATH || '.data/flights.sqlite');
    const service = new FlightService(repository, (scenario) => createFixtureSupplier({ scenario }));
    server = { repository, service };
  }
  return server;
}
