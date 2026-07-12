import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createMaintenanceRequest = async ({ asset_id, raised_by_user_id, issue_description, priority, photo_url }) => {
  const asset = await prisma.asset.findUnique({ where: { id: asset_id } });
  if (!asset) throw new AppError('Asset not found', 404);

  return prisma.maintenanceRequest.create({
    data: {
      asset_id,
      raised_by_user_id,
      issue_description,
      priority,
      photo_url,
      status: 'PENDING'
    },
    include: {
      asset: true,
      user: true
    }
  });
};

export const getMaintenanceRequests = async ({ asset_id, status }) => {
  const where = {};
  if (asset_id) where.asset_id = asset_id;
  if (status) where.status = status;

  return prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: true,
      user: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });
};

export const updateMaintenanceStatus = async (request_id, { status, technician_assigned }) => {
  return prisma.$transaction(async (tx) => {
    const reqItem = await tx.maintenanceRequest.findUnique({ where: { id: request_id } });
    if (!reqItem) throw new AppError('Maintenance request not found', 404);

    const updateData = { status };
    if (technician_assigned !== undefined) updateData.technician_assigned = technician_assigned;
    if (status === 'RESOLVED') updateData.resolved_at = new Date();

    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id: request_id },
      data: updateData,
      include: {
        asset: true,
        user: true
      }
    });

    // Auto-update asset status on approval vs resolution
    if (status === 'APPROVED' || status === 'IN_PROGRESS') {
      await tx.asset.update({
        where: { id: reqItem.asset_id },
        data: { status: 'UNDER_MAINTENANCE' }
      });
    } else if (status === 'RESOLVED' || status === 'REJECTED') {
      await tx.asset.update({
        where: { id: reqItem.asset_id },
        data: { status: 'AVAILABLE' }
      });
    }

    return updatedRequest;
  });
};
