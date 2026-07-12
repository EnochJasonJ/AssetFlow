import * as authService from '../services/auth.service.js';

export const signup = async (req, res, next) => {
  try {
    const { name, full_name, email, password } = req.body;
    
    const { user, session } = await authService.signupUser({
      name: name || full_name,
      email,
      password
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: session?.access_token || null,
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, session } = await authService.loginUser({ email, password });

    res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: session?.access_token || null,
      }
    });
  } catch (err) {
    next(err);
  }
};
