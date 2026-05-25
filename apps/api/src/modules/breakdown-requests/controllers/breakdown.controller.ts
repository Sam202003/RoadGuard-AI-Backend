import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getBreakdownRequestService } from '../index.js';
import type {
  AssignProviderBody,
  CancelBreakdownRequestBody,
  CreateBreakdownRequestBody,
  BreakdownRequestIdParams,
  ListBreakdownRequestsQuery,
  UpdateBreakdownStatusBody,
} from '../validators/breakdown.validator.js';

export async function createBreakdownRequest(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBreakdownRequestBody;
  const request = await getBreakdownRequestService().createRequest(req.user!.id, body);

  sendSuccess(res, {
    message: 'Breakdown request created successfully',
    data: { request },
    statusCode: 201,
  });
}

export async function listBreakdownRequests(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListBreakdownRequestsQuery;
  const user = { id: req.user!.id, role: req.user!.role };
  const { requests, meta } = await getBreakdownRequestService().listRequests(user, query);

  sendSuccess(res, {
    message: 'Breakdown requests fetched successfully',
    data: { requests },
    meta,
  });
}

export async function getBreakdownRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params as BreakdownRequestIdParams;
  const user = { id: req.user!.id, role: req.user!.role };
  const request = await getBreakdownRequestService().getRequestById(user, id);

  sendSuccess(res, {
    message: 'Breakdown request fetched successfully',
    data: { request },
  });
}

export async function updateBreakdownStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as BreakdownRequestIdParams;
  const body = req.body as UpdateBreakdownStatusBody;
  const user = { id: req.user!.id, role: req.user!.role };
  const request = await getBreakdownRequestService().updateStatus(user, id, body);

  sendSuccess(res, {
    message: 'Breakdown request status updated successfully',
    data: { request },
  });
}

export async function assignProviderToRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params as BreakdownRequestIdParams;
  const body = req.body as AssignProviderBody;
  const user = { id: req.user!.id, role: req.user!.role };
  const request = await getBreakdownRequestService().assignProvider(user, id, body);

  sendSuccess(res, {
    message: 'Provider assigned successfully',
    data: { request },
  });
}

export async function cancelBreakdownRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params as BreakdownRequestIdParams;
  const body = req.body as CancelBreakdownRequestBody;
  const user = { id: req.user!.id, role: req.user!.role };
  const request = await getBreakdownRequestService().cancelRequest(user, id, body);

  sendSuccess(res, {
    message: 'Breakdown request cancelled successfully',
    data: { request },
  });
}
