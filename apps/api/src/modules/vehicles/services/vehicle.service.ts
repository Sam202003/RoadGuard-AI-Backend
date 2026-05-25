import { Types } from 'mongoose';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import type { CreateVehicleInput, ListVehiclesQuery, UpdateVehicleInput } from '../dto/vehicle.dto.js';
import type { SafeVehicle } from '../interfaces/vehicle.interface.js';
import { VehicleRepository } from '../repositories/vehicle.repository.js';
import { toSafeVehicle } from '../utils/vehicle.mapper.js';

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  private async getOwnedVehicleOrThrow(vehicleId: string, ownerId: string) {
    const vehicle = await this.vehicleRepository.findByIdAndOwner(vehicleId, ownerId);

    if (!vehicle) {
      throw AppError.notFound('Vehicle not found');
    }

    return vehicle;
  }

  private async ensureRegistrationAvailable(
    ownerId: string,
    registrationNumber: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.vehicleRepository.findByOwnerAndRegistration(
      ownerId,
      registrationNumber,
    );

    if (existing && existing._id.toString() !== excludeId) {
      throw new AppError('Registration number already exists for this account', HTTP_STATUS.CONFLICT);
    }
  }

  private async handlePrimaryVehicle(
    ownerId: string,
    isPrimary: boolean,
    vehicleId?: string,
  ): Promise<void> {
    if (!isPrimary) return;
    await this.vehicleRepository.unsetPrimaryForOwner(ownerId, vehicleId);
  }

  async createVehicle(ownerId: string, input: CreateVehicleInput): Promise<SafeVehicle> {
    await this.ensureRegistrationAvailable(ownerId, input.registrationNumber);

    if (input.isPrimaryVehicle) {
      await this.vehicleRepository.unsetPrimaryForOwner(ownerId);
    }

    const vehicle = await this.vehicleRepository.create({
      ownerId: new Types.ObjectId(ownerId),
      vehicleType: input.vehicleType,
      brand: input.brand,
      vehicleModel: input.model,
      year: input.year,
      registrationNumber: input.registrationNumber,
      fuelType: input.fuelType,
      transmissionType: input.transmissionType,
      color: input.color ?? null,
      insuranceExpiryDate: input.insuranceExpiryDate ?? null,
      pollutionExpiryDate: input.pollutionExpiryDate ?? null,
      serviceDueDate: input.serviceDueDate ?? null,
      vehicleImages: input.vehicleImages ?? [],
      documents: input.documents ?? [],
      isPrimaryVehicle: input.isPrimaryVehicle ?? false,
    });

    return toSafeVehicle(vehicle);
  }

  async listVehicles(
    ownerId: string,
    query: ListVehiclesQuery,
  ): Promise<{ vehicles: SafeVehicle[]; meta: import('@roadguard/database').PaginationMeta }> {
    const result = await this.vehicleRepository.findByOwnerPaginated(ownerId, query);

    return {
      vehicles: result.data.map(toSafeVehicle),
      meta: result.meta,
    };
  }

  async getVehicleById(ownerId: string, vehicleId: string): Promise<SafeVehicle> {
    const vehicle = await this.getOwnedVehicleOrThrow(vehicleId, ownerId);
    return toSafeVehicle(vehicle);
  }

  async updateVehicle(
    ownerId: string,
    vehicleId: string,
    input: UpdateVehicleInput,
  ): Promise<SafeVehicle> {
    const vehicle = await this.getOwnedVehicleOrThrow(vehicleId, ownerId);

    if (input.registrationNumber) {
      await this.ensureRegistrationAvailable(ownerId, input.registrationNumber, vehicleId);
    }

    if (input.isPrimaryVehicle === true) {
      await this.handlePrimaryVehicle(ownerId, true, vehicleId);
    }

    if (input.vehicleType !== undefined) vehicle.vehicleType = input.vehicleType;
    if (input.brand !== undefined) vehicle.brand = input.brand;
    if (input.model !== undefined) vehicle.vehicleModel = input.model;
    if (input.year !== undefined) vehicle.year = input.year;
    if (input.registrationNumber !== undefined) {
      vehicle.registrationNumber = input.registrationNumber;
    }
    if (input.fuelType !== undefined) vehicle.fuelType = input.fuelType;
    if (input.transmissionType !== undefined) vehicle.transmissionType = input.transmissionType;
    if (input.color !== undefined) vehicle.color = input.color;
    if (input.insuranceExpiryDate !== undefined) {
      vehicle.insuranceExpiryDate = input.insuranceExpiryDate;
    }
    if (input.pollutionExpiryDate !== undefined) {
      vehicle.pollutionExpiryDate = input.pollutionExpiryDate;
    }
    if (input.serviceDueDate !== undefined) vehicle.serviceDueDate = input.serviceDueDate;
    if (input.vehicleImages !== undefined) vehicle.vehicleImages = input.vehicleImages;
    if (input.documents !== undefined) vehicle.documents = input.documents;
    if (input.isPrimaryVehicle !== undefined) vehicle.isPrimaryVehicle = input.isPrimaryVehicle;

    await vehicle.save();

    return toSafeVehicle(vehicle);
  }

  async deleteVehicle(ownerId: string, vehicleId: string): Promise<void> {
    await this.getOwnedVehicleOrThrow(vehicleId, ownerId);
    const deleted = await this.vehicleRepository.softDelete(vehicleId);

    if (!deleted) {
      throw AppError.notFound('Vehicle not found');
    }
  }
}
