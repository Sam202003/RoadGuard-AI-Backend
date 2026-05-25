import { Types } from 'mongoose';
import { BaseRepository, type PaginationParams, type PaginatedResult } from '@roadguard/database';
import { VehicleModel } from '../schemas/vehicle.schema.js';
import type { VehicleMongoDocument } from '../interfaces/vehicle.interface.js';

export class VehicleRepository extends BaseRepository<VehicleMongoDocument> {
  constructor() {
    super(VehicleModel);
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<VehicleMongoDocument | null> {
    return this.model
      .findOne({ _id: id, ownerId: new Types.ObjectId(ownerId) })
      .exec();
  }

  findByOwnerAndRegistration(
    ownerId: string,
    registrationNumber: string,
  ): Promise<VehicleMongoDocument | null> {
    return this.model
      .findOne({
        ownerId: new Types.ObjectId(ownerId),
        registrationNumber: registrationNumber.toUpperCase(),
      })
      .exec();
  }

  findByOwnerPaginated(
    ownerId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<VehicleMongoDocument>> {
    return this.findPaginated({
      ...params,
      baseFilter: { ownerId: new Types.ObjectId(ownerId) },
      searchFields: ['brand', 'vehicleModel', 'registrationNumber'],
    });
  }

  async unsetPrimaryForOwner(ownerId: string, exceptVehicleId?: string): Promise<void> {
    const filter: Record<string, unknown> = {
      ownerId: new Types.ObjectId(ownerId),
      isPrimaryVehicle: true,
    };

    if (exceptVehicleId) {
      filter._id = { $ne: new Types.ObjectId(exceptVehicleId) };
    }

    await this.model.updateMany(filter, { isPrimaryVehicle: false }).exec();
  }
}
