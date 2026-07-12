import * as auditService from '../services/audit.service.js';

export const createAuditCycle = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.title;
    const { department_id, start_date, end_date } = req.body;

    const cycle = await auditService.createAuditCycle({
      name,
      department_id,
      start_date,
      end_date
    });

    res.status(201).json(cycle);
  } catch (err) {
    next(err);
  }
};

export const getAuditCycles = async (req, res, next) => {
  try {
    const cycles = await auditService.getAuditCycles();
    res.status(200).json(cycles);
  } catch (err) {
    next(err);
  }
};

export const logAuditVerification = async (req, res, next) => {
  try {
    const { id } = req.params; // audit cycle id
    const { asset_id, status, remarks } = req.body;
    const verified_by_user_id = req.user.id;

    const log = await auditService.logAuditVerification(id, {
      asset_id,
      status,
      remarks,
      verified_by_user_id
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

export const closeAuditCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const closedCycle = await auditService.closeAuditCycle(id);
    res.status(200).json(closedCycle);
  } catch (err) {
    next(err);
  }
};
