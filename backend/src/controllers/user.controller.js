import * as userService from '../services/user.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    
    // Map to the format specified in APIS.md
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department_id: user.department_id,
      role: user.role,
      status: user.status
    }));

    res.status(200).json(formattedUsers);
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await userService.updateUserRole(id, role);

    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      department_id: updatedUser.department_id,
      role: updatedUser.role,
      status: updatedUser.status
    });
  } catch (err) {
    next(err);
  }
};
