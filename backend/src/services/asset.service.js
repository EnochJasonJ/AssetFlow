import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

const generateAssetTag = async () => {
  // Simple auto-generation: AF-XXXX
  // In a real high-concurrency enterprise app, you'd use a sequence or separate table.
  const count = await prisma.asset.count();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `AF-${nextNum}`;
};

export const registerAsset = async (data) => {
  const asset_tag = await generateAssetTag();
  
  const {
    name,
    category_id,
    serial_number,
    acquisition_date,
    acquisition_cost,
    condition = 'NEW',
    location,
    photo_url,
    is_bookable = false
  } = data;

  return prisma.asset.create({
    data: {
      name,
      category_id,
      serial_number,
      acquisition_date: acquisition_date ? new Date(acquisition_date) : undefined,
      acquisition_cost: acquisition_cost !== undefined ? Number(acquisition_cost) : undefined,
      condition,
      location,
      photo_url,
      is_bookable: Boolean(is_bookable),
      asset_tag,
      status: 'AVAILABLE'
    },
    include: {
      category: true
    }
  });
};

export const getAllAssets = async (filters) => {
  // filters could be { status: 'AVAILABLE', category_id: '...' }
  const where = {};
  
  if (filters.status) where.status = filters.status;
  if (filters.category_id) where.category_id = filters.category_id;
  if (filters.is_bookable !== undefined) where.is_bookable = filters.is_bookable === 'true';

  return prisma.asset.findMany({
    where,
    include: {
      category: true
    }
  });
};

export const getAssetHistory = async (id) => {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      allocations: {
        include: { user: true },
        orderBy: { created_at: 'desc' }
      },
      maintenance_history: {
        include: { user: true },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!asset) throw new AppError('Asset not found', 404);
  return asset;
};

// ==========================================
// ALLOCATIONS & TRANSFERS
// ==========================================

export const allocateAsset = async (asset_id, user_id, expected_return_date, condition_notes) => {
  if (!asset_id || !user_id) {
    throw new AppError('Please provide both asset_id and assigned_to_user_id (or assigned_to)', 400);
  }

  // Transaction to prevent double-allocation
  return prisma.$transaction(async (tx) => {
    // 1. Check if asset exists and is available
    const asset = await tx.asset.findUnique({
      where: { id: asset_id }
    });

    if (!asset) throw new AppError('Asset not found', 404);
    if (asset.status === 'ALLOCATED') throw new AppError('Asset is already allocated to someone else', 409);
    if (asset.status !== 'AVAILABLE') throw new AppError(`Cannot allocate asset. Current status: ${asset.status}`, 400);

    // 2. Create allocation record
    const allocation = await tx.allocation.create({
      data: {
        asset_id,
        assigned_to_user_id: user_id,
        expected_return_date,
        condition_notes
      }
    });

    // 3. Update asset status
    await tx.asset.update({
      where: { id: asset_id },
      data: { status: 'ALLOCATED' }
    });

    return allocation;
  });
};

export const returnAsset = async (allocation_id, condition_notes) => {
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.findUnique({ where: { id: allocation_id } });
    
    if (!allocation || !allocation.is_active) {
      throw new AppError('Active allocation not found', 404);
    }

    // 1. Close the allocation
    const updatedAllocation = await tx.allocation.update({
      where: { id: allocation_id },
      data: {
        is_active: false,
        returned_at: new Date(),
        condition_notes
      }
    });

    // 2. Mark asset as available
    await tx.asset.update({
      where: { id: allocation.asset_id },
      data: { status: 'AVAILABLE' }
    });

    return updatedAllocation;
  });
};

export const requestTransfer = async (asset_id, requested_by_user_id, reason) => {
  if (!asset_id || !requested_by_user_id) {
    throw new AppError('Please provide asset_id and requested_by_user_id (or to_user_id)', 400);
  }

  const asset = await prisma.asset.findUnique({ where: { id: asset_id } });
  
  if (!asset) throw new AppError('Asset not found', 404);
  if (asset.status !== 'ALLOCATED' && asset.status !== 'AVAILABLE') {
    throw new AppError('Can only request transfer for AVAILABLE or ALLOCATED assets', 400);
  }

  return prisma.transferRequest.create({
    data: {
      asset_id,
      requested_by_user_id,
      reason
    }
  });
};

export const approveTransfer = async (transfer_id) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({ 
      where: { id: transfer_id },
      include: { asset: true }
    });

    if (!transfer || transfer.status !== 'REQUESTED') {
      throw new AppError('Pending transfer request not found', 404);
    }

    // 1. Update transfer status
    const updatedTransfer = await tx.transferRequest.update({
      where: { id: transfer_id },
      data: { status: 'APPROVED' }
    });

    // 2. Find and close the current active allocation for this asset
    const currentAllocation = await tx.allocation.findFirst({
      where: { asset_id: transfer.asset_id, is_active: true }
    });

    if (currentAllocation) {
      await tx.allocation.update({
        where: { id: currentAllocation.id },
        data: { is_active: false, returned_at: new Date(), condition_notes: 'Transferred' }
      });
    }

    // 3. Create a new allocation for the requester
    await tx.allocation.create({
      data: {
        asset_id: transfer.asset_id,
        assigned_to_user_id: transfer.requested_by_user_id
      }
    });

    // Asset status remains ALLOCATED

    return updatedTransfer;
  });
};
