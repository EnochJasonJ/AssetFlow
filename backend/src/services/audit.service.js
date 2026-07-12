import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createAuditCycle = async ({ name, department_id, start_date, end_date }) => {
  const startDate = start_date ? new Date(start_date) : new Date();
  const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.auditCycle.create({
    data: {
      name,
      department_id,
      start_date: startDate,
      end_date: endDate,
      is_closed: false
    }
  });
};

export const getAuditCycles = async () => {
  return prisma.auditCycle.findMany({
    include: {
      auditors: true,
      items: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const logAuditVerification = async (audit_cycle_id, { asset_id, status, remarks, notes }) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: audit_cycle_id } });
  if (!cycle) throw new AppError('Audit cycle not found', 404);
  if (cycle.is_closed) throw new AppError('Cannot log verification for a closed audit cycle', 400);

  const status_found = status || 'VERIFIED';
  const itemNotes = remarks || notes;

  // Check if item already exists in this cycle
  const existingItem = await prisma.auditItem.findFirst({
    where: { audit_cycle_id, asset_id }
  });

  if (existingItem) {
    return prisma.auditItem.update({
      where: { id: existingItem.id },
      data: { status_found, notes: itemNotes }
    });
  }

  return prisma.auditItem.create({
    data: {
      audit_cycle_id,
      asset_id,
      status_found,
      notes: itemNotes
    }
  });
};

export const closeAuditCycle = async (audit_cycle_id) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: audit_cycle_id } });
  if (!cycle) throw new AppError('Audit cycle not found', 404);

  return prisma.auditCycle.update({
    where: { id: audit_cycle_id },
    data: {
      is_closed: true
    }
  });
};
