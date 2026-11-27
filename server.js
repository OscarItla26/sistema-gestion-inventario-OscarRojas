const express = require('express');
const path = require('path');
const db = require('./src/config/database');

// Importar rutas
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const movementRoutes = require('./src/routes/movementRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/movements', movementRoutes);

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'src/public')));

// Ruta para comprobar el funcionamiento del servidor
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Gestión de Inventario funcionando correctamente'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
