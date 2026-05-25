import { UserRole } from '@roadguard/types';
import { UserModel } from '../../users/schemas/user.schema.js';
import { getProviderRepository } from '../../providers/index.js';
import {
  BreakdownStatus,
  RequestPriority,
} from '../../breakdown-requests/constants/breakdown.enums.js';
import type { SafeBreakdownRequest } from '../../breakdown-requests/interfaces/breakdown.interface.js';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../constants/notification.enums.js';
import type { NotificationService } from '../services/notification.service.js';

export class BreakdownNotificationsIntegration {
  constructor(private readonly notificationService: NotificationService) {}

  private mapPriority(request: SafeBreakdownRequest): NotificationPriority {
    if (request.priority === RequestPriority.EMERGENCY) {
      return NotificationPriority.EMERGENCY;
    }
    if (request.priority === RequestPriority.HIGH) {
      return NotificationPriority.HIGH;
    }
    if (request.priority === RequestPriority.LOW) {
      return NotificationPriority.LOW;
    }
    return NotificationPriority.MEDIUM;
  }

  private baseMetadata(request: SafeBreakdownRequest): Record<string, unknown> {
    return {
      requestId: request.id,
      status: request.status,
      issueType: request.issueType,
      priority: request.priority,
    };
  }

  async onBreakdownCreated(request: SafeBreakdownRequest): Promise<void> {
    const priority = this.mapPriority(request);

    await this.notificationService.send({
      userId: request.customerId,
      title: 'Breakdown request submitted',
      message: `Your ${request.issueType.replace(/_/g, ' ').toLowerCase()} request has been created and we're finding help.`,
      type: NotificationType.BREAKDOWN_CREATED,
      metadata: this.baseMetadata(request),
      priority,
    });

    if (request.priority === RequestPriority.EMERGENCY) {
      await this.notifyAdminsEmergency(request, 'New emergency breakdown request');
    }

    if (request.assignedProviderId) {
      await this.onProviderAssigned(request, request.assignedProviderId);
    }
  }

  async onProviderAssigned(
    request: SafeBreakdownRequest,
    providerId: string,
  ): Promise<void> {
    const provider = await getProviderRepository().findById(providerId);
    const providerName = provider?.businessName ?? 'A provider';

    await this.notificationService.send({
      userId: request.customerId,
      title: 'Provider assigned',
      message: `${providerName} has been assigned to your breakdown request.`,
      type: NotificationType.PROVIDER_ASSIGNED,
      metadata: { ...this.baseMetadata(request), providerId },
      priority: this.mapPriority(request),
    });

    if (provider) {
      const notification = await this.notificationService.send({
        userId: provider.userId.toString(),
        title: 'New assignment',
        message: `You have been assigned to a ${request.issueType.replace(/_/g, ' ').toLowerCase()} request.`,
        type: NotificationType.PROVIDER_ASSIGNED,
        metadata: { ...this.baseMetadata(request), providerId },
        priority: this.mapPriority(request),
      });

      this.notificationService.emitToProviderRoom(providerId, notification);
    }
  }

  async onStatusUpdated(
    request: SafeBreakdownRequest,
    previousStatus?: BreakdownStatus,
  ): Promise<void> {
    const priority = this.mapPriority(request);
    const metadata = this.baseMetadata(request);

    if (request.status === BreakdownStatus.ARRIVED) {
      await this.notificationService.send({
        userId: request.customerId,
        title: 'Provider arrived',
        message: 'Your assigned provider has arrived at your location.',
        type: NotificationType.PROVIDER_ARRIVED,
        metadata,
        priority,
      });
      return;
    }

    if (request.status === BreakdownStatus.COMPLETED) {
      await this.notificationService.send({
        userId: request.customerId,
        title: 'Request completed',
        message: 'Your breakdown request has been marked as completed.',
        type: NotificationType.REQUEST_COMPLETED,
        metadata,
        priority,
      });

      if (request.assignedProviderId) {
        const provider = await getProviderRepository().findById(
          request.assignedProviderId,
        );
        if (provider) {
          await this.notificationService.send({
            userId: provider.userId.toString(),
            title: 'Request completed',
            message: 'A breakdown request you serviced has been completed.',
            type: NotificationType.REQUEST_COMPLETED,
            metadata,
            priority,
          });
        }
      }
      return;
    }

    if (
      request.priority === RequestPriority.EMERGENCY &&
      previousStatus !== request.status
    ) {
      await this.notifyAdminsEmergency(
        request,
        `Emergency request status: ${request.status}`,
      );
    }
  }

  async onRequestCancelled(request: SafeBreakdownRequest): Promise<void> {
    const priority = this.mapPriority(request);
    const metadata = {
      ...this.baseMetadata(request),
      cancellationReason: request.cancellationReason,
    };

    await this.notificationService.send({
      userId: request.customerId,
      title: 'Request cancelled',
      message: request.cancellationReason
        ? `Your breakdown request was cancelled: ${request.cancellationReason}`
        : 'Your breakdown request has been cancelled.',
      type: NotificationType.REQUEST_CANCELLED,
      metadata,
      priority,
    });

    if (request.assignedProviderId) {
      const provider = await getProviderRepository().findById(
        request.assignedProviderId,
      );
      if (provider) {
        await this.notificationService.send({
          userId: provider.userId.toString(),
          title: 'Request cancelled',
          message: 'A breakdown request assigned to you was cancelled.',
          type: NotificationType.REQUEST_CANCELLED,
          metadata,
          priority,
        });
      }
    }
  }

  private async notifyAdminsEmergency(
    request: SafeBreakdownRequest,
    message: string,
  ): Promise<void> {
    const admins = await UserModel.find({ role: UserRole.ADMIN, isActive: true })
      .select('_id')
      .lean()
      .exec();

    for (const admin of admins) {
      const notification = await this.notificationService.send({
        userId: admin._id.toString(),
        title: 'Emergency alert',
        message,
        type: NotificationType.EMERGENCY_ALERT,
        metadata: this.baseMetadata(request),
        priority: NotificationPriority.EMERGENCY,
        channels: [NotificationChannel.IN_APP],
      });

      this.notificationService.emitAdminAlert(notification);
    }
  }
}
