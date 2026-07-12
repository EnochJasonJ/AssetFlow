import { AppError } from '../utils/errors.js';

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
