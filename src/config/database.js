
const Database = require('better-sqlite3');
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, '../../database/inventory.db');

// Crear o conectar la base de datos
const db = new Database(dbPath);

// Activar las relaciones entre tablas
db.pragma('foreign_keys = ON');

// Crear las tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    price REAL NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    movement_type TEXT NOT NULL
      CHECK (movement_type IN ('entrada', 'salida')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE SET NULL
  );
`);

console.log('Base de datos y tablas creadas correctamente');

module.exports = db;
