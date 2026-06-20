import { BreakdownRequestRepository } from './repositories/breakdown.repository.js';
import { BreakdownRequestService } from './services/breakdown.service.js';

let breakdownRepository: BreakdownRequestRepository | null = null;
let breakdownService: BreakdownRequestService | null = null;

export function initBreakdownRequestsModule(): void {
  breakdownRepository = new BreakdownRequestRepository();
  breakdownService = new BreakdownRequestService(breakdownRepository);
}

export function getBreakdownRequestService(): BreakdownRequestService {
  if (!breakdownService) {
    throw new Error('Breakdown requests module not initialized');
  }
  return breakdownService;
}

export function getBreakdownRequestRepository(): BreakdownRequestRepository {
  if (!breakdownRepository) {
    throw new Error('Breakdown requests module not initialized');
  }
  return breakdownRepository;
}

export { breakdownRequestRouter } from './routes/breakdown.routes.js';
export {
  IssueType,
  RequestPriority,
  BreakdownStatus,
} from './constants/breakdown.enums.js';
export type { SafeBreakdownRequest, GeoPoint } from './interfaces/breakdown.interface.js';
