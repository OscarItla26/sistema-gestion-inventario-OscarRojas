
const db = require('../config/database');

// CREATE: Registrar una categoría
const createCategory = (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio.'
      });
    }

    const categoryName = name.trim();

    const existing = db.prepare(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)'
    ).get(categoryName);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre.'
      });
    }

    const result = db.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `).run(categoryName, description?.trim() || null);

    return res.status(201).json({
      success: true,
      message: 'Categoría registrada correctamente.',
      categoryId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error registrando categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar la categoría.'
    });
  }
};

// READ: Obtener todas las categorías
const getCategories = (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM categories ORDER BY id DESC
    `).all();

    return res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error consultando categorías:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar las categorías.'
    });
  }
};

// READ: Obtener una categoría por ID
const getCategoryById = (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El identificador de la categoría no es válido.'
      });
    }

    const category = db.prepare(
      'SELECT * FROM categories WHERE id = ?'
    ).get(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada.'
      });
    }

    return res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error consultando categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar la categoría.'
    });
  }
};

// UPDATE: Actualizar una categoría
const updateCategory = (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const { name, description } = req.body;

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El identificador de la categoría no es válido.'
      });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio.'
      });
    }

    const current = db.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).get(categoryId);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada.'
      });
    }

    const existing = db.prepare(`
      SELECT id FROM categories
      WHERE LOWER(name) = LOWER(?) AND id != ?
    `).get(name.trim(), categoryId);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra categoría con ese nombre.'
      });
    }

    db.prepare(`
      UPDATE categories
      SET name = ?, description = ?
      WHERE id = ?
    `).run(name.trim(), description?.trim() || null, categoryId);

    return res.json({
      success: true,
      message: 'Categoría actualizada correctamente.'
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la categoría.'
    });
  }
};

// DELETE: Eliminar una categoría
const deleteCategory = (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El identificador de la categoría no es válido.'
      });
    }

    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).get(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada.'
      });
    }

    const products = db.prepare(
      'SELECT id FROM products WHERE category_id = ? LIMIT 1'
    ).get(categoryId);

    if (products) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados.'
      });
    }

    db.prepare(
      'DELETE FROM categories WHERE id = ?'
    ).run(categoryId);

    return res.json({
      success: true,
      message: 'Categoría eliminada correctamente.'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al eliminar la categoría.'
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
