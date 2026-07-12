import { supabase } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('The token belonging to this user does no longer exist or is invalid.', 401));
    }

    // Fetch our custom user profile from Prisma
    const currentUser = await prisma.user.findUnique({
      where: { auth_id: user.id },
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
    req.supabaseUser = user;
    
    next();
  } catch (err) {
    next(err);
  }
};
