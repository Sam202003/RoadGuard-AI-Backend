import type {
  NearbyProvidersQuery,
  OnboardProviderBody,
  UpdateAvailabilityBody,
  UpdateLocationBody,
  UpdateProviderBody,
} from '../validators/provider.validator.js';

export type OnboardProviderInput = OnboardProviderBody;
export type UpdateProviderInput = UpdateProviderBody;
export type UpdateAvailabilityInput = UpdateAvailabilityBody;
export type UpdateLocationInput = UpdateLocationBody;
export type NearbySearchInput = NearbyProvidersQuery;
