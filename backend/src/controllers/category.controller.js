import * as categoryService from '../services/category.service.js';

export const createCategory = async (req, res, next) => {
  try {
    const { name, custom_fields } = req.body;
    
    const category = await categoryService.createCategory({ name, custom_fields });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updatedCategory = await categoryService.updateCategory(id, data);
    res.status(200).json(updatedCategory);
  } catch (err) {
    next(err);
  }
};
