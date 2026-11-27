// Elementos principales del dashboard
const totalProducts = document.getElementById('totalProducts');
const totalCategories = document.getElementById('totalCategories');
const totalStock = document.getElementById('totalStock');
const lowStock = document.getElementById('lowStock');
const productsTable = document.getElementById('productsTable');

// Formatear valores como moneda dominicana
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(value);
};

// Cargar productos desde la API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error('No se pudieron cargar los productos');
        }

        const products = result.data;

        // Actualizar estadísticas
        totalProducts.textContent = products.length;

        const stockTotal = products.reduce(
            (total, product) => total + Number(product.quantity),
            0
        );

        const productsLowStock = products.filter(
            product => Number(product.quantity) <= Number(product.min_stock)
        );

        totalStock.textContent = stockTotal;
        lowStock.textContent = productsLowStock.length;

        // Mostrar productos en la tabla de inventario
        if (products.length === 0) {
            productsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No hay productos registrados todavía.
                    </td>
                </tr>
            `;
        } else {
            productsTable.innerHTML = products.map(product => {
                const quantity = Number(product.quantity);
                const minStock = Number(product.min_stock);

                let status = 'Disponible';
                let statusClass = 'available';

                if (quantity === 0) {
                    status = 'Agotado';
                    statusClass = 'low';
                } else if (quantity <= minStock) {
                    status = 'Stock bajo';
                    statusClass = 'low';
                }

                return `
                    <tr>
                        <td>${escapeHTML(product.code)}</td>
                        <td>${escapeHTML(product.name)}</td>
                        <td>${escapeHTML(product.category_name || 'Sin categoría')}</td>
                        <td>${formatCurrency(Number(product.price))}</td>
                        <td>${quantity}</td>
                        <td>
                            <span class="stock-status ${statusClass}">
                                ${status}
                            </span>
                        </td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${product.id}">
                                Editar
                            </button>

                            <button class="action-btn delete-btn" data-id="${product.id}">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Mostrar alertas de stock
        const alertsTable = document.getElementById('alertsTable');

        const alertProducts = products.filter(
            product => Number(product.quantity) <= Number(product.min_stock)
        );

        if (alertProducts.length === 0) {
            alertsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        No hay alertas de stock. ¡Todo está en orden!
                    </td>
                </tr>
            `;
        } else {
            alertsTable.innerHTML = alertProducts.map(product => {
                const quantity = Number(product.quantity);
                const minStock = Number(product.min_stock);

                const status = quantity === 0
                    ? 'Agotado'
                    : 'Stock bajo';

                return `
                    <tr>
                        <td>${escapeHTML(product.code)}</td>
                        <td>${escapeHTML(product.name)}</td>
                        <td>${quantity}</td>
                        <td>${minStock}</td>
                        <td>
                            <span class="stock-status low">
                                ${status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error cargando productos:', error);

        productsTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    Error al cargar los productos.
                </td>
            </tr>
        `;
    }
}



// Cargar y mostrar categorías
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error('No se pudieron cargar las categorías');
        }

        const categories = result.data;

        totalCategories.textContent = categories.length;

        const categoriesTable = document.getElementById('categoriesTable');

        if (categories.length === 0) {
            categoriesTable.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        No hay categorías registradas todavía.
                    </td>
                </tr>
            `;
            return;
        }

        categoriesTable.innerHTML = categories.map(category => `
            <tr>
                <td>${category.id}</td>
                <td>${escapeHTML(category.name)}</td>
                <td>${escapeHTML(category.description || 'Sin descripción')}</td>
                <td>
                    <button class="action-btn edit-category-btn"
                        data-id="${category.id}">
                        Editar
                    </button>

                    <button class="action-btn delete-category-btn"
                        data-id="${category.id}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Evitar que datos ingresados por usuarios se interpreten como HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

// ======================================
// EDICIÓN DE PRODUCTOS
// ======================================

let editingProductId = null;

// Abrir formulario para editar
async function editProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo consultar el producto');
        }

        const product = result.data;

        editingProductId = productId;

        document.getElementById('productCode').value = product.code;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value =
            product.description || '';

        document.getElementById('productPrice').value = product.price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productMinStock').value = product.min_stock;

        await loadCategoryOptions();

        productCategory.value = product.category_id || '';

        productModal.classList.add('active');

        document.querySelector('.modal-header h2').textContent =
            'Editar producto';

        document.querySelector('.save-btn').textContent =
            'Guardar cambios';

    } catch (error) {
        console.error('Error editando producto:', error);
        alert(error.message);
    }
}

// Detectar acciones en la tabla de productos
productsTable.addEventListener('click', async (event) => {

    // Editar producto
    const editButton = event.target.closest('.edit-btn');

    if (editButton) {
        await editProduct(editButton.dataset.id);
        return;
    }

    // Eliminar producto
    const deleteButton = event.target.closest('.delete-btn');

    if (deleteButton) {
        await deleteProduct(deleteButton.dataset.id);
    }
});

// ======================================
// ELIMINAR PRODUCTOS
// ======================================

async function deleteProduct(productId) {

    const confirmation = confirm(
        '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
    );

    if (!confirmation) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo eliminar el producto');
        }

        alert('Producto eliminado correctamente.');

        await initializeDashboard();

    } catch (error) {
        console.error('Error eliminando producto:', error);
        alert(error.message);
    }
}

// Inicializar dashboard
async function initializeDashboard() {
  await Promise.all([
    loadProducts(),
    loadCategories()
  ]);
}

document.addEventListener('DOMContentLoaded', initializeDashboard);

// ======================================
// MODAL Y REGISTRO DE PRODUCTOS
// ======================================

const productModal = document.getElementById('productModal');
const addProductBtn = document.getElementById('addProductBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const productForm = document.getElementById('productForm');
const productCategory = document.getElementById('productCategory');
const formMessage = document.getElementById('formMessage');

// Abrir formulario
addProductBtn.addEventListener('click', async () => {
    editingProductId = null;

    productForm.reset();
    formMessage.textContent = '';

    document.querySelector('.modal-header h2').textContent =
        'Registrar producto';

    document.querySelector('.save-btn').textContent =
        'Guardar producto';

    productModal.classList.add('active');

    await loadCategoryOptions();
});

// Cerrar formulario
function closeProductModal() {
    productModal.classList.remove('active');

    productForm.reset();
    formMessage.textContent = '';

    editingProductId = null;

    document.querySelector('.modal-header h2').textContent =
        'Registrar producto';

    document.querySelector('.save-btn').textContent =
        'Guardar producto';
}

closeModalBtn.addEventListener('click', closeProductModal);
cancelModalBtn.addEventListener('click', closeProductModal);

// Cerrar al hacer clic fuera de la ventana
productModal.addEventListener('click', (event) => {
    if (event.target === productModal) {
        closeProductModal();
    }
});

// Cargar categorías en el selector
async function loadCategoryOptions() {
    try {
        const response = await fetch('/api/categories');
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error('No se pudieron cargar las categorías');
        }

        productCategory.innerHTML = '<option value="">Sin categoría</option>';

        result.data.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            productCategory.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando categorías:', error);
        formMessage.textContent = 'No se pudieron cargar las categorías.';
    }
}

// Registrar producto
productForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const product = {
        code: document.getElementById('productCode').value.trim(),
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category_id: productCategory.value
            ? Number(productCategory.value)
            : null,
        price: Number(document.getElementById('productPrice').value),
        quantity: Number(document.getElementById('productQuantity').value),
        min_stock: Number(document.getElementById('productMinStock').value)
    };

    if (
        !product.code ||
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price < 0 ||
        !Number.isInteger(product.quantity) ||
        product.quantity < 0 ||
        !Number.isInteger(product.min_stock) ||
        product.min_stock < 0
    ) {
        formMessage.textContent = 'Verifica los datos ingresados.';
        return;
    }

    try {
        const url = editingProductId
             ? `/api/products/${editingProductId}`
             : '/api/products';

        const method = editingProductId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Error al registrar el producto');
        }

        formMessage.textContent = '¡Producto registrado correctamente!';

        await initializeDashboard();

        setTimeout(() => {
            closeProductModal();
        }, 1000);

    } catch (error) {
        console.error('Error registrando producto:', error);
        formMessage.textContent = error.message;
    }
});

// ======================================
// GESTIÓN DE CATEGORÍAS
// ======================================

const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const addCategoryBtn = document.getElementById('addCategoryBtn');

let editingCategoryId = null;

// Abrir formulario para nueva categoría
addCategoryBtn.addEventListener('click', () => {
    editingCategoryId = null;
    categoryForm.reset();

    document.getElementById('categoryModalTitle').textContent =
        'Nueva categoría';

    document.getElementById('saveCategoryBtn').textContent =
        'Guardar categoría';

    document.getElementById('categoryFormMessage').textContent = '';

    categoryModal.classList.add('active');
});

// Cerrar formulario
function closeCategoryModal() {
    categoryModal.classList.remove('active');
    categoryForm.reset();

    editingCategoryId = null;

    document.getElementById('categoryModalTitle').textContent =
        'Nueva categoría';

    document.getElementById('saveCategoryBtn').textContent =
        'Guardar categoría';

    document.getElementById('categoryFormMessage').textContent = '';
}

document.getElementById('closeCategoryModal')
    .addEventListener('click', closeCategoryModal);

document.getElementById('cancelCategoryModal')
    .addEventListener('click', closeCategoryModal);

// Registrar o actualizar categoría
categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = {
        name: document.getElementById('categoryName').value.trim(),
        description: document.getElementById('categoryDescription').value.trim()
    };

    if (!category.name) {
        document.getElementById('categoryFormMessage').textContent =
            'El nombre de la categoría es obligatorio.';
        return;
    }

    try {
        const url = editingCategoryId
            ? `/api/categories/${editingCategoryId}`
            : '/api/categories';

        const method = editingCategoryId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo guardar la categoría');
        }

        document.getElementById('categoryFormMessage').textContent =
            'Categoría guardada correctamente.';

        await initializeDashboard();

        setTimeout(closeCategoryModal, 800);

    } catch (error) {
        console.error('Error guardando categoría:', error);

        document.getElementById('categoryFormMessage').textContent =
            error.message;
    }
});

// Detectar acciones de la tabla

document.getElementById('categoriesTable')
    .addEventListener('click', async (event) => {

        const editButton = event.target.closest('.edit-category-btn');
        const deleteButton = event.target.closest('.delete-category-btn');

        if (editButton) {
            await editCategory(editButton.dataset.id);
            return;
        }

        if (deleteButton) {
            await deleteCategory(deleteButton.dataset.id);
            return;
        }
    });


// Editar categoría
async function editCategory(categoryId) {
    try {
        const response = await fetch(`/api/categories/${categoryId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se encontró la categoría');
        }

        const category = result.data;

        editingCategoryId = categoryId;

        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value =
            category.description || '';

        document.getElementById('categoryModalTitle').textContent =
            'Editar categoría';

        document.getElementById('saveCategoryBtn').textContent =
            'Guardar cambios';

        categoryModal.classList.add('active');

    } catch (error) {
        console.error('Error editando categoría:', error);
        alert(error.message);
    }
}

// Eliminar categoría
async function deleteCategory(categoryId) {
    const confirmation = confirm(
        '¿Estás seguro de que deseas eliminar esta categoría?'
    );

    if (!confirmation) return;

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo eliminar la categoría');
        }

        alert('Categoría eliminada correctamente.');

        await initializeDashboard();

    } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert(error.message);
    }
}


// ======================================
// BUSCADOR DE PRODUCTOS
// ======================================

const productSearch = document.getElementById('productSearch');

productSearch.addEventListener('input', () => {
    const searchTerm = productSearch.value
        .trim()
        .toLowerCase();

    const rows = document.querySelectorAll('#productsTable tr');

    rows.forEach(row => {
        // Excluir la columna ACCIONES
        const productCells = Array.from(row.cells)
            .slice(0, 6);

        const productText = productCells
            .map(cell => cell.textContent.toLowerCase())
            .join(' ');

        row.style.display = productText.includes(searchTerm)
            ? ''
            : 'none';
    });
});

// ======================================
// NAVEGACIÓN ENTRE SECCIONES
// ======================================

// Secciones
const dashboardSection = document.getElementById('dashboardSection');
const inventorySection = document.getElementById('inventorySection');
const categoriesSection = document.getElementById('categoriesSection');
const alertsSection = document.getElementById('alertsSection');
const movementsSection = document.getElementById('movementsSection');

// Opciones del menú
const dashboardNav = document.getElementById('dashboardNav');
const inventoryNav = document.getElementById('inventoryNav');
const registerProductNav = document.getElementById('registerProductNav');
const categoriesNav = document.getElementById('categoriesNav');
const stockAlertsNav = document.getElementById('stockAlertsNav');
const movementsNav = document.getElementById('movementsNav');

// Título principal
const pageTitle = document.querySelector('.topbar h1');

// Todas las secciones y enlaces
const sections = [
    dashboardSection,
    inventorySection,
    categoriesSection,
    alertsSection,
    movementsSection
];

const navLinks = [
    dashboardNav,
    inventoryNav,
    registerProductNav,
    categoriesNav,
    stockAlertsNav,
    movementsNav
];

// Función para mostrar una sección
function showSection(section, title, activeLink) {

    // Ocultar todas las secciones
    sections.forEach(item => {
        item.classList.add('section-hidden');
    });

    // Mostrar la sección seleccionada
    section.classList.remove('section-hidden');

    // Actualizar título
    pageTitle.textContent = title;

    // Actualizar enlace activo
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    activeLink.classList.add('active');
}

// Navegación del Dashboard
dashboardNav.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(dashboardSection, 'Dashboard', dashboardNav);
});

// Navegación del Inventario
inventoryNav.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(inventorySection, 'Inventario', inventoryNav);
});

// Registrar producto
registerProductNav.addEventListener('click', (event) => {
    event.preventDefault();

    showSection(inventorySection, 'Inventario', registerProductNav);

    document.getElementById('addProductBtn').click();
});

// Navegación de Categorías
categoriesNav.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(categoriesSection, 'Categorías', categoriesNav);
});

// Navegación de Alertas
stockAlertsNav.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(alertsSection, 'Alertas de stock', stockAlertsNav);
});

movementsNav.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(movementsSection, 'Movimientos de inventario', movementsNav);
    loadMovements();
});

// Mostrar Dashboard al iniciar
showSection(dashboardSection, 'Dashboard', dashboardNav);

// Cargar historial de movimientos

async function loadMovements() {
    const movementsTable = document.getElementById('movementsTable');

    try {
        const response = await fetch('/api/movements');
        const result = await response.json();

        if (!result.success) {
            throw new Error('No se pudieron cargar los movimientos.');
        }

        if (result.data.length === 0) {
            movementsTable.innerHTML = `
                <tr>
                    <td colspan="6">No hay movimientos registrados.</td>
                </tr>
            `;
            return;
        }

        movementsTable.innerHTML = result.data.map(movement => {
            const isEntry = movement.movement_type === 'entrada';

            return `
                <tr>
                    <td>${movement.product_name}</td>
                    <td>${movement.product_code}</td>
                    <td>
                        <span class="movement-badge ${isEntry ? 'entry' : 'exit'}">
                            ${isEntry ? 'Entrada' : 'Salida'}
                        </span>
                    </td>
                    <td class="${isEntry ? 'movement-entry' : 'movement-exit'}">
                        ${isEntry ? '+' : '-'}${movement.quantity}
                    </td>
                    <td>${movement.reason || 'Sin motivo'}</td>
                    <td>${movement.created_at}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando movimientos:', error);

        movementsTable.innerHTML = `
            <tr>
                <td colspan="6">Error al cargar el historial.</td>
            </tr>
        `;
    }
}



// Elementos del modal de movimientos
const movementModal = document.getElementById('movementModal');
const addMovementBtn = document.getElementById('addMovementBtn');
const closeMovementModalBtn = document.getElementById('closeMovementModalBtn');
const cancelMovementBtn = document.getElementById('cancelMovementBtn');
const movementProduct = document.getElementById('movementProduct');

// Cargar productos disponibles en el formulario
async function loadMovementProducts() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();

        if (!result.success) {
            throw new Error('No se pudieron cargar los productos.');
        }

        movementProduct.innerHTML = `
            <option value="">Seleccionar producto</option>
        `;

        result.data.forEach(product => {
            movementProduct.innerHTML += `
                <option value="${product.id}">
                    ${product.code} - ${product.name} (Stock: ${product.quantity})
                </option>
            `;
        });

    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// Abrir modal
addMovementBtn.addEventListener('click', () => {
    loadMovementProducts();
    movementModal.style.display = 'flex';
});

// Cerrar modal
function closeMovementModal() {
    movementModal.style.display = 'none';
}

closeMovementModalBtn.addEventListener('click', closeMovementModal);
cancelMovementBtn.addEventListener('click', closeMovementModal);


// Registrar movimiento desde el formulario
const movementForm = document.getElementById('movementForm');
const movementFormMessage = document.getElementById('movementFormMessage');

movementForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const movementData = {
        product_id: Number(movementProduct.value),
        movement_type: document.getElementById('movementType').value,
        quantity: Number(document.getElementById('movementQuantity').value),
        reason: document.getElementById('movementReason').value.trim()
    };

    try {
        const response = await fetch('/api/movements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movementData)
        });

        const result = await response.json();

        if (!result.success) {
            movementFormMessage.textContent = result.message;
            movementFormMessage.style.color = 'red';
            return;
        }

        movementFormMessage.textContent = result.message;
        movementFormMessage.style.color = 'green';

        // Actualizar información del sistema
        await loadProducts();
        await loadMovements();
        await loadMovementProducts();

        movementForm.reset();

        setTimeout(() => {
            closeMovementModal();
            movementFormMessage.textContent = '';
        }, 1200);

    } catch (error) {
        console.error('Error registrando movimiento:', error);
        movementFormMessage.textContent = 'Error al conectar con el servidor.';
        movementFormMessage.style.color = 'red';
    }
});
