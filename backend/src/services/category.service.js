import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createCategory = async ({ name, custom_fields }) => {
  return prisma.assetCategory.create({
    data: { name, custom_fields }
  });
};

export const getAllCategories = async () => {
  return prisma.assetCategory.findMany();
};

export const updateCategory = async (id, data) => {
  const category = await prisma.assetCategory.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return prisma.assetCategory.update({
    where: { id },
    data
  });
};
