import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createAuditCycle = async ({ title, created_by_user_id }) => {
  return prisma.auditCycle.create({
    data: {
      title,
      created_by_user_id,
      status: 'OPEN'
    }
  });
};

export const getAuditCycles = async () => {
  return prisma.auditCycle.findMany({
    include: {
      creator: true,
      logs: {
        include: { asset: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
};

export const logAuditVerification = async (audit_cycle_id, { asset_id, status, remarks, verified_by_user_id }) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: audit_cycle_id } });
  if (!cycle) throw new AppError('Audit cycle not found', 404);
  if (cycle.status !== 'OPEN') throw new AppError('Cannot log verification for a closed audit cycle', 400);

  // Check if already logged in this cycle
  const existingLog = await prisma.auditLog.findFirst({
    where: { audit_cycle_id, asset_id }
  });

  if (existingLog) {
    return prisma.auditLog.update({
      where: { id: existingLog.id },
      data: { status, remarks, verified_by_user_id }
    });
  }

  return prisma.auditLog.create({
    data: {
      audit_cycle_id,
      asset_id,
      status,
      remarks,
      verified_by_user_id
    }
  });
};

export const closeAuditCycle = async (audit_cycle_id) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: audit_cycle_id } });
  if (!cycle) throw new AppError('Audit cycle not found', 404);

  return prisma.auditCycle.update({
    where: { id: audit_cycle_id },
    data: {
      status: 'CLOSED',
      completed_at: new Date()
    }
  });
};
