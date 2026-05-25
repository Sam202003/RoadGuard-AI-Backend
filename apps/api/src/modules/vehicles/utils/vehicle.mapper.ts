import type { SafeVehicle, VehicleMongoDocument } from '../interfaces/vehicle.interface.js';

function formatDate(date?: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export function toSafeVehicle(vehicle: VehicleMongoDocument): SafeVehicle {
  return {
    id: vehicle._id.toString(),
    ownerId: vehicle.ownerId.toString(),
    vehicleType: vehicle.vehicleType,
    brand: vehicle.brand,
    model: vehicle.vehicleModel,
    year: vehicle.year,
    registrationNumber: vehicle.registrationNumber,
    fuelType: vehicle.fuelType,
    transmissionType: vehicle.transmissionType,
    color: vehicle.color ?? null,
    insuranceExpiryDate: formatDate(vehicle.insuranceExpiryDate),
    pollutionExpiryDate: formatDate(vehicle.pollutionExpiryDate),
    serviceDueDate: formatDate(vehicle.serviceDueDate),
    vehicleImages: vehicle.vehicleImages ?? [],
    documents: vehicle.documents ?? [],
    isPrimaryVehicle: vehicle.isPrimaryVehicle,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}
