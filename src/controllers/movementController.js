const db = require('../config/database');

// Registrar entrada o salida de inventario
const createMovement = (req, res) => {
    try {
        const {
            product_id,
            movement_type,
            quantity,
            reason
        } = req.body;

        // Validar datos obligatorios
        if (!product_id || !movement_type || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El producto, tipo y cantidad son obligatorios.'
            });
        }

        if (!['entrada', 'salida'].includes(movement_type)) {
            return res.status(400).json({
                success: false,
                message: 'El tipo debe ser entrada o salida.'
            });
        }

        const amount = Number(quantity);

        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser un número entero mayor que cero.'
            });
        }

        // Obtener producto
        const product = db.prepare(
            'SELECT * FROM products WHERE id = ?'
        ).get(product_id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado.'
            });
        }

        // Comprobar disponibilidad para salidas
        if (movement_type === 'salida' && amount > product.quantity) {
            return res.status(400).json({
                success: false,
                message: 'No hay suficiente stock disponible.'
            });
        }

        // Calcular nueva existencia
        const newQuantity = movement_type === 'entrada'
            ? product.quantity + amount
            : product.quantity - amount;

        // Registrar movimiento y actualizar stock en una transacción
        const registerMovement = db.transaction(() => {
            const movement = db.prepare(`
                INSERT INTO inventory_movements (
                    product_id,
                    product_code,
                    product_name,
                    movement_type,
                    quantity,
                    reason
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                product.id,
                product.code,
                product.name,
                movement_type,
                amount,
                reason || null
            );

            db.prepare(`
                UPDATE products
                SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newQuantity, product.id);

            return movement.lastInsertRowid;
        });

        const movementId = registerMovement();

        return res.status(201).json({
            success: true,
            message: movement_type === 'entrada'
                ? 'Entrada registrada correctamente.'
                : 'Salida registrada correctamente.',
            data: {
                movement_id: movementId,
                product_id: product.id,
                product_name: product.name,
                movement_type,
                quantity: amount,
                previous_stock: product.quantity,
                current_stock: newQuantity
            }
        });

    } catch (error) {
        console.error('Error registrando movimiento:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al registrar el movimiento.'
        });
    }
};

// Consultar historial de movimientos
const getMovements = (req, res) => {
    try {
        const movements = db.prepare(`
            SELECT *
            FROM inventory_movements
            ORDER BY created_at DESC, id DESC
        `).all();

        return res.json({
            success: true,
            data: movements
        });

    } catch (error) {
        console.error('Error consultando movimientos:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al consultar los movimientos.'
        });
    }
};

module.exports = {
    createMovement,
    getMovements
};
