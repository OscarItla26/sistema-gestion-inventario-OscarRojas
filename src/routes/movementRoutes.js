
const express = require('express');
const router = express.Router();

const {
    createMovement,
    getMovements
} = require('../controllers/movementController');

// Registrar un movimiento
router.post('/', createMovement);

// Consultar historial de movimientos
router.get('/', getMovements);

module.exports = router;
