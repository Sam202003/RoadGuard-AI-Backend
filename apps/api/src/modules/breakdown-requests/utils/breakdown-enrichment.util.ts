import { getUserRepository } from '../../users/index.js';
import { getVehicleRepository } from '../../vehicles/index.js';
import type { SafeBreakdownRequest } from '../interfaces/breakdown.interface.js';

export async function enrichBreakdownRequestsWithDetails(
  requests: SafeBreakdownRequest[],
): Promise<SafeBreakdownRequest[]> {
  if (requests.length === 0) return requests;

  const userIds = [...new Set(requests.map((request) => request.customerId))];
  const vehicleIds = [...new Set(requests.map((request) => request.vehicleId))];

  const userRepository = getUserRepository();
  const vehicleRepository = getVehicleRepository();

  const [users, vehicles] = await Promise.all([
    Promise.all(userIds.map((id) => userRepository.findById(id))),
    Promise.all(vehicleIds.map((id) => vehicleRepository.findById(id))),
  ]);

  const userMap = new Map(userIds.map((id, index) => [id, users[index]]));
  const vehicleMap = new Map(vehicleIds.map((id, index) => [id, vehicles[index]]));

  return requests.map((request) => {
    const customer = userMap.get(request.customerId);
    const vehicle = vehicleMap.get(request.vehicleId);

    return {
      ...request,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : null,
      vehicleLabel: vehicle
        ? `${vehicle.brand} ${vehicle.vehicleModel} (${vehicle.registrationNumber})`
        : null,
    };
  });
}

export async function enrichBreakdownRequestWithDetails(
  request: SafeBreakdownRequest,
): Promise<SafeBreakdownRequest> {
  const [enriched] = await enrichBreakdownRequestsWithDetails([request]);
  return enriched;
}
