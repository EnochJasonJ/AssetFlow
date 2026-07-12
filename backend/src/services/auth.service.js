import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const signupUser = async ({ name, email, password }) => {
  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (authError) {
    throw new AppError(authError.message, 400);
  }

  // 2. Create user in our Prisma Database
  const user = await prisma.user.create({
    data: {
      auth_id: authData.user.id,
      name,
      email,
      role: 'EMPLOYEE', // Default role per requirements
      status: 'ACTIVE'
    }
  });

  return { user, session: authData.session };
};

export const loginUser = async ({ email, password }) => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    throw new AppError('Incorrect email or password', 401);
  }

  const user = await prisma.user.findUnique({
    where: { auth_id: authData.user.id }
  });

  if (!user) {
    throw new AppError('User not found in database', 404);
  }

  return { user, session: authData.session };
};
