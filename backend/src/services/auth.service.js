import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-enterprise-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '7d';

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const signupUser = async ({ name, email, password }) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Bootstrap rule: First registered user becomes ADMIN, all subsequent users become EMPLOYEE
  const userCount = await prisma.user.count();
  const assignedRole = userCount === 0 ? 'ADMIN' : 'EMPLOYEE';

  const user = await prisma.user.create({
    data: {
      name: name || email.split('@')[0],
      email,
      password_hash,
      role: assignedRole,
      status: 'ACTIVE'
    }
  });

  const token = signToken(user);

  return {
    user,
    session: { access_token: token }
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.password_hash) {
    throw new AppError('Incorrect email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Incorrect email or password', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('This account has been deactivated.', 403);
  }

  const token = signToken(user);

  return {
    user,
    session: { access_token: token }
  };
};
