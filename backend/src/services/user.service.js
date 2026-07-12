import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    include: {
      department: true
    }
  });
  return users;
};

export const updateUserRole = async (userId, role) => {
  // role should be one of ADMIN, DEPARTMENT_HEAD, ASSET_MANAGER, EMPLOYEE
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    include: { department: true }
  });

  return updatedUser;
};
