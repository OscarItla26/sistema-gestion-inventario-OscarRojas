const db = require('../config/database');

// CREATE: Registrar una categoría
const createCategory = (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }

    const statement = db.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `);

    const result = statement.run(
      name.trim(),
      description || null
    );

    res.status(201).json({
      success: true,
      message: 'Categoría registrada correctamente',
      categoryId: result.lastInsertRowid
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar la categoría',
      error: error.message
    });
  }
};

// READ: Obtener todas las categorías
const getCategories = (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM categories
      ORDER BY id DESC
    `).all();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al consultar las categorías',
      error: error.message
    });
  }
};

// READ: Obtener una categoría por ID
const getCategoryById = (req, res) => {
  try {
    const category = db.prepare(`
      SELECT * FROM categories WHERE id = ?
    `).get(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al consultar la categoría',
      error: error.message
    });
  }
};

// UPDATE: Actualizar una categoría
const updateCategory = (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }

    const result = db.prepare(`
      UPDATE categories
      SET name = ?, description = ?
      WHERE id = ?
    `).run(
      name.trim(),
      description || null,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría actualizada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la categoría',
      error: error.message
    });
  }
};

// DELETE: Eliminar una categoría
const deleteCategory = (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM categories WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la categoría',
      error: error.message
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
