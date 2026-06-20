import { UserRole } from '@roadguard/types';
import { AppError } from '../../../errors/index.js';
import { invalidateUserStatusCache } from '../../../middlewares/user-status-cache.js';
import {
  BreakdownStatus,
  RequestPriority,
} from '../../breakdown-requests/constants/breakdown.enums.js';
import { getBreakdownRequestRepository } from '../../breakdown-requests/index.js';
import { OnlineStatus } from '../../providers/constants/provider.enums.js';
import { getProviderRepository, getProviderService } from '../../providers/index.js';
import { getUserRepository } from '../../users/index.js';
import {
  toAdminActivityItem,
  toAdminProvider,
  toAdminUser,
  type AdminAnalyticsDto,
  type AdminDashboardStatsDto,
} from '../utils/admin.mapper.js';
import type {
  ListAdminProvidersQuery,
  ListAdminUsersQuery,
  UpdateAdminProviderKycBody,
  UpdateAdminUserStatusBody,
} from '../validators/admin.validator.js';

const ACTIVE_BREAKDOWN_STATUSES: BreakdownStatus[] = [
  BreakdownStatus.CREATED,
  BreakdownStatus.SEARCHING_PROVIDER,
  BreakdownStatus.PROVIDER_ASSIGNED,
  BreakdownStatus.ON_THE_WAY,
  BreakdownStatus.ARRIVED,
  BreakdownStatus.IN_PROGRESS,
];

export class AdminService {
  async getDashboard(): Promise<{
    stats: AdminDashboardStatsDto;
    activity: ReturnType<typeof toAdminActivityItem>[];
  }> {
    const userRepository = getUserRepository();
    const providerRepository = getProviderRepository();
    const breakdownRepository = getBreakdownRequestRepository();

    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      activeBreakdownRequests,
      completedRequests,
      emergencyRequests,
      onlineProviders,
      recentRequests,
    ] = await Promise.all([
      userRepository.count({}),
      userRepository.count({ role: UserRole.CUSTOMER }),
      userRepository.count({ role: UserRole.PROVIDER }),
      breakdownRepository.count({ status: { $in: ACTIVE_BREAKDOWN_STATUSES } }),
      breakdownRepository.count({ status: BreakdownStatus.COMPLETED }),
      breakdownRepository.count({ priority: RequestPriority.EMERGENCY }),
      providerRepository.count({ onlineStatus: OnlineStatus.ONLINE }),
      breakdownRepository.findAllPaginated({ limit: 12, sort: 'updatedAt:desc' }),
    ]);

    return {
      stats: {
        totalUsers,
        totalCustomers,
        totalProviders,
        activeBreakdownRequests,
        completedRequests,
        emergencyRequests,
        onlineProviders,
      },
      activity: recentRequests.data.map(toAdminActivityItem),
    };
  }

  async listUsers(query: ListAdminUsersQuery) {
    const result = await getUserRepository().findPaginatedAdmin({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
      role: query.role,
    });

    return {
      users: result.data.map(toAdminUser),
      meta: result.meta,
    };
  }

  async getUserById(id: string) {
    const user = await getUserRepository().findById(id);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return toAdminUser(user);
  }

  async updateUserStatus(id: string, body: UpdateAdminUserStatusBody) {
    const user = await getUserRepository().updateById(id, { isActive: body.isActive });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    invalidateUserStatusCache(id);
    return toAdminUser(user);
  }

  async listProviders(query: ListAdminProvidersQuery) {
    const result = await getProviderRepository().findPaginatedAdmin({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
      availabilityStatus: query.availabilityStatus,
      onlineStatus: query.onlineStatus,
    });

    return {
      providers: result.data.map(toAdminProvider),
      meta: result.meta,
    };
  }

  async getProviderById(id: string) {
    const provider = await getProviderRepository().findById(id);

    if (!provider) {
      throw AppError.notFound('Provider not found');
    }

    return toAdminProvider(provider);
  }

  async updateProviderKyc(id: string, body: UpdateAdminProviderKycBody) {
    await getProviderService().updateKycStatus(id, body.kycStatus);
    return this.getProviderById(id);
  }

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    const breakdownRepository = getBreakdownRequestRepository();
    const providerRepository = getProviderRepository();

    const [statusCounts, requestsPerDay, emergencyRequestCount, topProviders] =
      await Promise.all([
        breakdownRepository.aggregateStatusCounts(),
        breakdownRepository.aggregateRequestsPerDay(14),
        breakdownRepository.count({ priority: RequestPriority.EMERGENCY }),
        providerRepository.findPaginatedAdmin({
          limit: 8,
          sort: 'totalCompletedRequests:desc',
        }),
      ]);

    const allStatuses = Object.values(BreakdownStatus);
    const countMap = new Map(statusCounts.map((row) => [row.status, row.count]));

    return {
      requestsByStatus: allStatuses.map((status) => ({
        status,
        count: countMap.get(status) ?? 0,
      })),
      requestsPerDay,
      providerActivity: topProviders.data.map((provider) => ({
        providerName: provider.businessName,
        completedCount: provider.totalCompletedRequests ?? 0,
      })),
      emergencyRequestCount,
    };
  }
}
