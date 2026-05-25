import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getProviderService } from '../index.js';
import type {
  NearbyProvidersQuery,
  OnboardProviderBody,
  UpdateAvailabilityBody,
  UpdateLocationBody,
  UpdateProviderBody,
} from '../validators/provider.validator.js';

export async function onboardProvider(req: Request, res: Response): Promise<void> {
  const body = req.body as OnboardProviderBody;
  const provider = await getProviderService().onboardProvider(req.user!.id, body);

  sendSuccess(res, {
    message: 'Provider onboarded successfully',
    data: { provider },
    statusCode: 201,
  });
}

export async function getMyProvider(req: Request, res: Response): Promise<void> {
  const provider = await getProviderService().getMyProfile(req.user!.id);

  sendSuccess(res, {
    message: 'Provider profile fetched',
    data: { provider },
  });
}

export async function updateMyProvider(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateProviderBody;
  const provider = await getProviderService().updateMyProfile(req.user!.id, body);

  sendSuccess(res, {
    message: 'Provider profile updated',
    data: { provider },
  });
}

export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateAvailabilityBody;
  const provider = await getProviderService().updateAvailability(req.user!.id, body);

  sendSuccess(res, {
    message: 'Availability updated',
    data: { provider },
  });
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateLocationBody;
  const provider = await getProviderService().updateLocation(req.user!.id, body);

  sendSuccess(res, {
    message: 'Location updated',
    data: { provider },
  });
}

export async function getNearbyProviders(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as NearbyProvidersQuery;
  const providers = await getProviderService().findNearbyProviders(query);

  sendSuccess(res, {
    message: 'Nearby providers fetched',
    data: { providers },
    meta: { count: providers.length },
  });
}
