import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getAdminService } from '../index.js';
import type {
  AdminProviderIdParams,
  AdminUserIdParams,
  ListAdminProvidersQuery,
  ListAdminUsersQuery,
  UpdateAdminProviderKycBody,
  UpdateAdminUserStatusBody,
} from '../validators/admin.validator.js';

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const data = await getAdminService().getDashboard();

  sendSuccess(res, {
    message: 'Admin dashboard fetched successfully',
    data,
  });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = req.query as ListAdminUsersQuery;
  const { users, meta } = await getAdminService().listUsers(query);

  sendSuccess(res, {
    message: 'Users fetched successfully',
    data: { users },
    meta: meta as unknown as Record<string, unknown>,
  });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params as AdminUserIdParams;
  const user = await getAdminService().getUserById(id);

  sendSuccess(res, {
    message: 'User fetched successfully',
    data: { user },
  });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as AdminUserIdParams;
  const body = req.body as UpdateAdminUserStatusBody;
  const user = await getAdminService().updateUserStatus(id, body);

  sendSuccess(res, {
    message: 'User status updated successfully',
    data: { user },
  });
}

export async function listProviders(req: Request, res: Response): Promise<void> {
  const query = req.query as ListAdminProvidersQuery;
  const { providers, meta } = await getAdminService().listProviders(query);

  sendSuccess(res, {
    message: 'Providers fetched successfully',
    data: { providers },
    meta: meta as unknown as Record<string, unknown>,
  });
}

export async function getProvider(req: Request, res: Response): Promise<void> {
  const { id } = req.params as AdminProviderIdParams;
  const provider = await getAdminService().getProviderById(id);

  sendSuccess(res, {
    message: 'Provider fetched successfully',
    data: { provider },
  });
}

export async function updateProviderKyc(req: Request, res: Response): Promise<void> {
  const { id } = req.params as AdminProviderIdParams;
  const body = req.body as UpdateAdminProviderKycBody;
  const provider = await getAdminService().updateProviderKyc(id, body);

  sendSuccess(res, {
    message: 'Provider KYC status updated successfully',
    data: { provider },
  });
}

export async function getAnalytics(_req: Request, res: Response): Promise<void> {
  const analytics = await getAdminService().getAnalytics();

  sendSuccess(res, {
    message: 'Analytics fetched successfully',
    data: analytics,
  });
}
