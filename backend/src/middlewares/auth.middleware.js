import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-enterprise-secret-jwt-key-2026';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // Fetch user profile from Prisma
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { department: true }
    });

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists in the database.', 401));
    }

    if (currentUser.status !== 'ACTIVE') {
      return next(new AppError('This account has been deactivated.', 403));
    }

    // Grant access to protected route
    req.user = currentUser;
    
    next();
  } catch (err) {
    next(err);
  }
};
