import * as dashboardService from '../services/dashboard.service.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
};
