import type { BreakdownMongoDocument, SafeBreakdownRequest } from '../interfaces/breakdown.interface.js';

export function toSafeBreakdownRequest(doc: BreakdownMongoDocument): SafeBreakdownRequest {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    vehicleId: doc.vehicleId.toString(),
    assignedProviderId: doc.assignedProviderId?.toString() ?? null,
    issueType: doc.issueType,
    issueDescription: doc.issueDescription,
    images: doc.images ?? [],
    priority: doc.priority,
    status: doc.status,
    location: doc.location,
    requestedAt: doc.requestedAt.toISOString(),
    assignedAt: doc.assignedAt?.toISOString() ?? null,
    arrivedAt: doc.arrivedAt?.toISOString() ?? null,
    completedAt: doc.completedAt?.toISOString() ?? null,
    cancelledAt: doc.cancelledAt?.toISOString() ?? null,
    estimatedArrivalTime: doc.estimatedArrivalTime ?? null,
    estimatedDistance: doc.estimatedDistance ?? null,
    serviceCost: doc.serviceCost ?? null,
    cancellationReason: doc.cancellationReason ?? null,
    aiDiagnosisSummary: doc.aiDiagnosisSummary ?? null,
    notes: doc.notes ?? null,
    trackingEnabled: doc.trackingEnabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
