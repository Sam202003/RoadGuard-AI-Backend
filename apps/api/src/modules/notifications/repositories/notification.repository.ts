import { Types } from 'mongoose';
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationParams,
} from '@roadguard/database';
import { NotificationModel } from '../schemas/notification.schema.js';
import { NotificationStatus } from '../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../interfaces/notification.interface.js';

export interface ListNotificationsFilter {
  unreadOnly?: boolean;
  type?: string;
}

export class NotificationRepository extends BaseRepository<NotificationMongoDocument> {
  constructor() {
    super(NotificationModel);
  }

  findByUserPaginated(
    userId: string,
    params: PaginationParams & ListNotificationsFilter = {},
  ): Promise<PaginatedResult<NotificationMongoDocument>> {
    const baseFilter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (params.unreadOnly) {
      baseFilter.readAt = null;
      baseFilter.status = { $ne: NotificationStatus.READ };
    }

    if (params.type) {
      baseFilter.type = params.type;
    }

    const sort = params.sort ?? '-createdAt';

    return this.findPaginated({
      page: params.page,
      limit: params.limit,
      sort,
      search: params.search,
      baseFilter,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.model
      .countDocuments({
        userId: new Types.ObjectId(userId),
        readAt: null,
        status: { $ne: NotificationStatus.READ },
      })
      .exec();
  }

  markAsRead(id: string, userId: string): Promise<NotificationMongoDocument | null> {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          userId: new Types.ObjectId(userId),
          readAt: null,
        },
        {
          readAt: new Date(),
          status: NotificationStatus.READ,
        },
        { new: true },
      )
      .exec();
  }

  markAllAsRead(userId: string): Promise<number> {
    return this.model
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          readAt: null,
        },
        {
          readAt: new Date(),
          status: NotificationStatus.READ,
        },
      )
      .exec()
      .then((result) => result.modifiedCount);
  }

  findByIdAndUser(id: string, userId: string): Promise<NotificationMongoDocument | null> {
    return this.model
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }
}
