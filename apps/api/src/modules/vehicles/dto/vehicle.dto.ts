import type { CreateVehicleBody, UpdateVehicleBody } from '../validators/vehicle.validator.js';

export type CreateVehicleInput = CreateVehicleBody;
export type UpdateVehicleInput = UpdateVehicleBody;

export interface ListVehiclesQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}
