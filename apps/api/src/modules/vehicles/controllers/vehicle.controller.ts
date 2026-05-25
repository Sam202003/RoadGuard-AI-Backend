import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getVehicleService } from '../index.js';
import type {
  CreateVehicleBody,
  ListVehiclesQuery,
  UpdateVehicleBody,
  VehicleIdParams,
} from '../validators/vehicle.validator.js';

export async function createVehicle(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateVehicleBody;
  const vehicle = await getVehicleService().createVehicle(req.user!.id, body);

  sendSuccess(res, {
    message: 'Vehicle created successfully',
    data: { vehicle },
    statusCode: 201,
  });
}

export async function listVehicles(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListVehiclesQuery;
  const { vehicles, meta } = await getVehicleService().listVehicles(req.user!.id, query);

  sendSuccess(res, {
    message: 'Vehicles fetched successfully',
    data: { vehicles },
    meta: meta as unknown as Record<string, unknown>,
  });
}

export async function getVehicle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as VehicleIdParams;
  const vehicle = await getVehicleService().getVehicleById(req.user!.id, id);

  sendSuccess(res, {
    message: 'Vehicle fetched successfully',
    data: { vehicle },
  });
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as VehicleIdParams;
  const body = req.body as UpdateVehicleBody;
  const vehicle = await getVehicleService().updateVehicle(req.user!.id, id, body);

  sendSuccess(res, {
    message: 'Vehicle updated successfully',
    data: { vehicle },
  });
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as VehicleIdParams;
  await getVehicleService().deleteVehicle(req.user!.id, id);

  sendSuccess(res, {
    message: 'Vehicle deleted successfully',
  });
}
