import { VehicleRepository } from './repositories/vehicle.repository.js';
import { VehicleService } from './services/vehicle.service.js';

let vehicleRepository: VehicleRepository | null = null;
let vehicleService: VehicleService | null = null;

export function initVehiclesModule(): void {
  vehicleRepository = new VehicleRepository();
  vehicleService = new VehicleService(vehicleRepository);
}

export function getVehicleService(): VehicleService {
  if (!vehicleService) {
    throw new Error('Vehicles module not initialized');
  }
  return vehicleService;
}

export function getVehicleRepository(): VehicleRepository {
  if (!vehicleRepository) {
    throw new Error('Vehicles module not initialized');
  }
  return vehicleRepository;
}

export { vehicleRouter } from './routes/vehicle.routes.js';
export {
  VehicleType,
  FuelType,
  TransmissionType,
  VehicleDocumentType,
} from './constants/vehicle.enums.js';
export type { SafeVehicle, IVehicle } from './interfaces/vehicle.interface.js';
