import { BreakdownStatus } from '../constants/breakdown.enums.js';

const ALLOWED_TRANSITIONS: Record<BreakdownStatus, BreakdownStatus[]> = {
  [BreakdownStatus.CREATED]: [BreakdownStatus.SEARCHING_PROVIDER, BreakdownStatus.CANCELLED],
  [BreakdownStatus.SEARCHING_PROVIDER]: [
    BreakdownStatus.PROVIDER_ASSIGNED,
    BreakdownStatus.CANCELLED,
  ],
  [BreakdownStatus.PROVIDER_ASSIGNED]: [
    BreakdownStatus.ON_THE_WAY,
    BreakdownStatus.CANCELLED,
  ],
  [BreakdownStatus.ON_THE_WAY]: [BreakdownStatus.ARRIVED, BreakdownStatus.CANCELLED],
  [BreakdownStatus.ARRIVED]: [BreakdownStatus.IN_PROGRESS, BreakdownStatus.CANCELLED],
  [BreakdownStatus.IN_PROGRESS]: [BreakdownStatus.COMPLETED, BreakdownStatus.CANCELLED],
  [BreakdownStatus.COMPLETED]: [],
  [BreakdownStatus.CANCELLED]: [],
};

export function canTransition(from: BreakdownStatus, to: BreakdownStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: BreakdownStatus): boolean {
  return status === BreakdownStatus.COMPLETED || status === BreakdownStatus.CANCELLED;
}
