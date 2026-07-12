import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createDepartment = async ({ name, head_id, parent_department_id }) => {
  if (head_id) {
    const head = await prisma.user.findUnique({ where: { id: head_id } });
    if (!head) throw new AppError('Department head not found', 404);
  }

  if (parent_department_id) {
    const parent = await prisma.department.findUnique({ where: { id: parent_department_id } });
    if (!parent) throw new AppError('Parent department not found', 404);
  }

  return prisma.department.create({
    data: { name, head_id, parent_department_id }
  });
};

export const getAllDepartments = async () => {
  return prisma.department.findMany({
    include: {
      sub_departments: true
    }
  });
};

export const updateDepartment = async (id, data) => {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw new AppError('Department not found', 404);

  return prisma.department.update({
    where: { id },
    data
  });
};
