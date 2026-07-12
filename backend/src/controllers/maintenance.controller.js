import * as maintenanceService from '../services/maintenance.service.js';

export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { asset_id, issue_description, priority, photo_url } = req.body;
    const raised_by_user_id = req.user.id;

    const maintenance = await maintenanceService.createMaintenanceRequest({
      asset_id,
      raised_by_user_id,
      issue_description,
      priority,
      photo_url
    });

    res.status(201).json(maintenance);
  } catch (err) {
    next(err);
  }
};

export const getMaintenanceRequests = async (req, res, next) => {
  try {
    const { asset_id, status } = req.query;
    const requests = await maintenanceService.getMaintenanceRequests({ asset_id, status });
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

export const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, technician_assigned } = req.body;

    const updated = await maintenanceService.updateMaintenanceStatus(id, {
      status,
      technician_assigned
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};
