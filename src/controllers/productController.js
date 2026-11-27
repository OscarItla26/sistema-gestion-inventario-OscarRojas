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
      quantity = 0,
      min_stock = 5
    } = req.body;

    // Validar campos obligatorios
    if (!code?.trim() || !name?.trim() || price === undefined || price === '') {
      return res.status(400).json({
        success: false,
        message: 'El código, nombre y precio son obligatorios.'
      });
    }

    // Convertir y validar valores numéricos
    const productPrice = Number(price);
    const productQuantity = Number(quantity);
    const minimumStock = Number(min_stock);

    if (!Number.isFinite(productPrice) || productPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número válido mayor o igual a cero.'
      });
    }

    if (!Number.isSafeInteger(productQuantity) || productQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número entero no negativo.'
      });
    }

    if (!Number.isSafeInteger(minimumStock) || minimumStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock mínimo debe ser un número entero no negativo.'
      });
    }

    // Comprobar que el código no esté registrado
    const existingProduct = db.prepare(
      'SELECT id FROM products WHERE code = ?'
    ).get(code.trim());

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un producto registrado con ese código.'
      });
    }

    // Comprobar que la categoría exista
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const category = db.prepare(
        'SELECT id FROM categories WHERE id = ?'
      ).get(category_id);

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'La categoría seleccionada no existe.'
        });
      }
    }

    // Registrar producto
    const statement = db.prepare(`
      INSERT INTO products
      (code, name, description, category_id, price, quantity, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      code.trim(),
      name.trim(),
      description?.trim() || null,
      category_id || null,
      productPrice,
      productQuantity,
      minimumStock
    );

    return res.status(201).json({
      success: true,
      message: 'Producto registrado correctamente.',
      productId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error registrando producto:', error);

    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar el producto.'
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

    const productId = Number(req.params.id);

    // Verificar que el producto exista
    const currentProduct = db.prepare(
      'SELECT id FROM products WHERE id = ?'
    ).get(productId);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    // Validar campos obligatorios
    if (!code?.trim() || !name?.trim() || price === undefined || price === '') {
      return res.status(400).json({
        success: false,
        message: 'El código, nombre y precio son obligatorios.'
      });
    }

    // Validar valores numéricos
    const productPrice = Number(price);
    const productQuantity = Number(quantity);
    const minimumStock = Number(min_stock);

    if (!Number.isFinite(productPrice) || productPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número válido mayor o igual a cero.'
      });
    }

    if (!Number.isSafeInteger(productQuantity) || productQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número entero no negativo.'
      });
    }

    if (!Number.isSafeInteger(minimumStock) || minimumStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock mínimo debe ser un número entero no negativo.'
      });
    }

    // Comprobar que el código no pertenezca a otro producto
    const existingProduct = db.prepare(`
      SELECT id FROM products
      WHERE code = ? AND id != ?
    `).get(code.trim(), productId);

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro producto registrado con ese código.'
      });
    }

    // Comprobar que la categoría exista
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const category = db.prepare(
        'SELECT id FROM categories WHERE id = ?'
      ).get(category_id);

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'La categoría seleccionada no existe.'
        });
      }
    }

    // Actualizar producto
    db.prepare(`
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
    `).run(
      code.trim(),
      name.trim(),
      description?.trim() || null,
      category_id || null,
      productPrice,
      productQuantity,
      minimumStock,
      productId
    );

    return res.json({
      success: true,
      message: 'Producto actualizado correctamente.'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);

    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el producto.'
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
