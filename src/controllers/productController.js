const db = require('../config/database');

// CREATE: Registrar un producto
const createProduct = (req, res) => {
  try {
    const {
      code,
      name,
      description,
      category_id,
      price,
      quantity,
      min_stock
    } = req.body;

    if (!code || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El código, nombre y precio son obligatorios'
      });
    }

    const statement = db.prepare(`
      INSERT INTO products
      (code, name, description, category_id, price, quantity, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      code,
      name,
      description || null,
      category_id || null,
      Number(price),
      Number(quantity ?? 0),
      Number(min_stock ?? 5)
    );

    res.status(201).json({
      success: true,
      message: 'Producto registrado correctamente',
      productId: result.lastInsertRowid
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar el producto',
      error: error.message
    });
  }
};

// READ: Obtener todos los productos
const getProducts = (req, res) => {
  try {
    const products = db.prepare(`
      SELECT products.*, categories.name AS category_name
      FROM products
      LEFT JOIN categories ON products.category_id = categories.id
      ORDER BY products.id DESC
    `).all();

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al consultar los productos',
      error: error.message
    });
  }
};

// READ: Obtener un producto por su ID
const getProductById = (req, res) => {
  try {
    const product = db.prepare(`
      SELECT * FROM products WHERE id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al consultar el producto',
      error: error.message
    });
  }
};

// UPDATE: Actualizar un producto
const updateProduct = (req, res) => {
  try {
    const {
      code,
      name,
      description,
      category_id,
      price,
      quantity,
      min_stock
    } = req.body;

    const statement = db.prepare(`
      UPDATE products
      SET code = ?,
          name = ?,
          description = ?,
          category_id = ?,
          price = ?,
          quantity = ?,
          min_stock = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = statement.run(
      code,
      name,
      description || null,
      category_id || null,
      Number(price),
      Number(quantity),
      Number(min_stock),
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto',
      error: error.message
    });
  }
};

// DELETE: Eliminar un producto
const deleteProduct = (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM products WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el producto',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
