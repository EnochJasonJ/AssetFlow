import * as departmentService from '../services/department.service.js';

export const createDepartment = async (req, res, next) => {
  try {
    const { name, head_id, parent_department_id } = req.body;
    
    const department = await departmentService.createDepartment({ 
      name, 
      head_id, 
      parent_department_id 
    });

    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json(departments);
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body; // Can contain name, head_id, status
    
    const updatedDepartment = await departmentService.updateDepartment(id, data);
    res.status(200).json(updatedDepartment);
  } catch (err) {
    next(err);
  }
};
