import { ProviderType } from '../../providers/constants/provider.enums.js';
import { IssueType } from '../constants/breakdown.enums.js';

const ISSUE_TO_PROVIDER_TYPES: Record<IssueType, ProviderType[]> = {
  [IssueType.FLAT_TIRE]: [ProviderType.MECHANIC, ProviderType.TOWING],
  [IssueType.BATTERY_FAILURE]: [ProviderType.BATTERY_SUPPORT, ProviderType.MECHANIC],
  [IssueType.FUEL_EMPTY]: [ProviderType.FUEL_DELIVERY],
  [IssueType.ENGINE_FAILURE]: [ProviderType.MECHANIC, ProviderType.TOWING],
  [IssueType.ACCIDENT]: [ProviderType.TOWING, ProviderType.MECHANIC],
  [IssueType.BRAKE_FAILURE]: [ProviderType.MECHANIC, ProviderType.TOWING],
  [IssueType.OVERHEATING]: [ProviderType.MECHANIC],
  [IssueType.LOCKOUT]: [ProviderType.MECHANIC],
  [IssueType.EV_BATTERY_LOW]: [ProviderType.EV_SUPPORT, ProviderType.BATTERY_SUPPORT],
};

export function getPreferredProviderTypes(issueType: IssueType): ProviderType[] {
  return ISSUE_TO_PROVIDER_TYPES[issueType] ?? [ProviderType.MECHANIC];
}
