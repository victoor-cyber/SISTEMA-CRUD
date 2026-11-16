/**
 * Formulario CRUD del catálogo de productos.
 * Consume la API REST del mismo servidor usando fetch + JWT.
 */

const API = '/api';

const state = {
  token: sessionStorage.getItem('token') ?? '',
  user: JSON.parse(sessionStorage.getItem('user') ?? 'null'),
  products: [],
  editingId: null,
  searchTimeout: null,
};

const els = {
  loginView: document.getElementById('loginView'),
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginBtn: document.getElementById('loginBtn'),
  loginMessage: document.getElementById('loginMessage'),

  crudView: document.getElementById('crudView'),
  session: document.getElementById('session'),
  userLabel: document.getElementById('userLabel'),
  logoutBtn: document.getElementById('logoutBtn'),

  form: document.getElementById('productForm'),
  formTitle: document.getElementById('formTitle'),
  nombre: document.getElementById('nombre'),
  descripcion: document.getElementById('descripcion'),
  precio: document.getElementById('precio'),
  stock: document.getElementById('stock'),
  categoria: document.getElementById('categoria'),
  activo: document.getElementById('activo'),
  saveBtn: document.getElementById('saveBtn'),
  cancelBtn: document.getElementById('cancelBtn'),

  searchInput: document.getElementById('searchInput'),
  reloadBtn: document.getElementById('reloadBtn'),
  productsBody: document.getElementById('productsBody'),
  counter: document.getElementById('counter'),
  toast: document.getElementById('toast'),
};

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

let toastTimer = null;

function showToast(message, type = 'success') {
  els.toast.textContent = message;
  els.toast.className = `toast ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.className = 'toast hidden';
  }, 4200);
}

/** Petición a la API con manejo de errores uniforme. */
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ?? `Error HTTP ${response.status}`,
    );
    error.status = response.status;
    error.details = payload?.error?.details ?? [];
    throw error;
  }

  return { status: response.status, body: payload };
}

function handleError(error) {
  if (error.status === 401) {
    logout('Tu sesión expiró o el token no es válido. Inicia sesión de nuevo.', true);
    return;
  }

  const details = (error.details ?? [])
    .map((detail) => `${detail.campo}: ${detail.mensaje}`)
    .join(' · ');

  showToast(
    `${error.message}${details ? ` → ${details}` : ''}`,
    'error',
  );
}

/* ---------------- Sesión ---------------- */

async function login(event) {
  event.preventDefault();

  els.loginBtn.disabled = true;
  els.loginBtn.textContent = 'Validando...';
  els.loginMessage.textContent = '';

  try {
    const { body } = await request('/auth/login', {
      method: 'POST',
      auth: false,
      body: {
        email: els.loginEmail.value.trim(),
        password: els.loginPassword.value,
      },
    });

    state.token = body.data.token;
    state.user = body.data.user;

    sessionStorage.setItem('token', state.token);
    sessionStorage.setItem('user', JSON.stringify(state.user));

    enterApp();
    showToast(`Bienvenido, ${state.user.nombre}`, 'success');
  } catch (error) {
    els.loginMessage.textContent =
      error.status === 401
        ? 'Credenciales incorrectas. Verifica el correo y la contraseña.'
        : error.message;
  } finally {
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = 'Entrar';
  }
}

function enterApp() {
  els.loginView.classList.add('hidden');
  els.crudView.classList.remove('hidden');
  els.session.classList.remove('hidden');
  els.userLabel.textContent = `${state.user?.nombre ?? ''} · ${state.user?.email ?? ''}`;

  loadProducts();
}

function logout(message, isError = false) {
  state.token = '';
  state.user = null;
  state.products = [];
  state.editingId = null;

  sessionStorage.clear();
  resetForm();

  els.crudView.classList.add('hidden');
  els.session.classList.add('hidden');
  els.loginView.classList.remove('hidden');
  els.loginPassword.value = '';
  els.loginMessage.textContent = '';

  if (message) {
    if (isError) {
      els.loginMessage.textContent = message;
    } else {
      showToast(message, 'success');
    }
  }
}

/* ---------------- Productos ---------------- */

async function loadProducts() {
  const params = new URLSearchParams({ limit: '100', sort: 'createdAt', order: 'desc' });
  const search = els.searchInput.value.trim();
  if (search) params.set('search', search);

  try {
    const { body } = await request(`/productos?${params.toString()}`, {
      auth: false,
    });

    state.products = body.data;
    renderProducts();
  } catch (error) {
    handleError(error);
  }
}

function renderProducts() {
  els.counter.textContent = `${state.products.length} registro${
    state.products.length === 1 ? '' : 's'
  }`;

  if (state.products.length === 0) {
    els.productsBody.innerHTML =
      '<tr><td colspan="6" class="empty">No hay productos. Crea el primero con el formulario.</td></tr>';
    return;
  }

  els.productsBody.innerHTML = state.products
    .map(
      (product) => `
        <tr>
          <td>
            <strong>${escapeHtml(product.nombre)}</strong>
            <small>${escapeHtml(product.descripcion) || 'Sin descripción'}</small>
          </td>
          <td><span class="tag">${escapeHtml(product.categoria)}</span></td>
          <td class="right">${money.format(product.precio)}</td>
          <td class="center">${product.stock}</td>
          <td class="center">
            <span class="badge ${product.activo ? 'on' : 'off'}">
              ${product.activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td class="right">
            <div class="actions-cell">
              <button class="btn btn-small" type="button" data-action="edit" data-id="${product.id}" title="Editar" aria-label="Editar ${escapeHtml(product.nombre)}">
                ✏️<span class="btn-label"> Editar</span>
              </button>
              <button class="btn btn-small btn-danger" type="button" data-action="delete" data-id="${product.id}" title="Eliminar" aria-label="Eliminar ${escapeHtml(product.nombre)}">
                🗑️<span class="btn-label"> Eliminar</span>
              </button>
            </div>
          </td>
        </tr>
      `,
    )
    .join('');
}

async function saveProduct(event) {
  event.preventDefault();

  const payload = {
    nombre: els.nombre.value.trim(),
    descripcion: els.descripcion.value.trim(),
    precio: Number(els.precio.value),
    stock: Number(els.stock.value || 0),
    categoria: els.categoria.value.trim() || 'General',
    activo: els.activo.checked,
  };

  if (payload.nombre.length < 3) {
    showToast('El nombre debe tener al menos 3 caracteres.', 'error');
    els.nombre.focus();
    return;
  }

  if (!Number.isFinite(payload.precio) || payload.precio <= 0) {
    showToast('El precio debe ser un número mayor que 0.', 'error');
    els.precio.focus();
    return;
  }

  const isEditing = Boolean(state.editingId);

  els.saveBtn.disabled = true;
  els.saveBtn.textContent = isEditing ? 'Actualizando...' : 'Guardando...';

  try {
    const { status } = isEditing
      ? await request(`/productos/${state.editingId}`, { method: 'PUT', body: payload })
      : await request('/productos', { method: 'POST', body: payload });

    showToast(
      `${isEditing ? 'Producto actualizado' : 'Producto creado'} correctamente (HTTP ${status})`,
      'success',
    );

    resetForm();
    await loadProducts();
  } catch (error) {
    handleError(error);
  } finally {
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = state.editingId
      ? 'Guardar cambios'
      : 'Guardar producto';
  }
}

function startEdit(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;

  state.editingId = id;

  els.nombre.value = product.nombre;
  els.descripcion.value = product.descripcion ?? '';
  els.precio.value = product.precio;
  els.stock.value = product.stock;
  els.categoria.value = product.categoria;
  els.activo.checked = product.activo;

  els.formTitle.textContent = 'Editar producto';
  els.saveBtn.textContent = 'Guardar cambios';
  els.cancelBtn.classList.remove('hidden');

  els.nombre.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  const product = state.products.find((item) => item.id === id);
  const name = product?.nombre ?? 'este producto';

  if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const { status } = await request(`/productos/${id}`, { method: 'DELETE' });
    showToast(`Producto eliminado (HTTP ${status})`, 'success');

    if (state.editingId === id) resetForm();
    await loadProducts();
  } catch (error) {
    handleError(error);
  }
}

function resetForm() {
  state.editingId = null;

  els.form.reset();
  els.stock.value = '0';
  els.categoria.value = 'General';
  els.activo.checked = true;

  els.formTitle.textContent = 'Nuevo producto';
  els.saveBtn.textContent = 'Guardar producto';
  els.cancelBtn.classList.add('hidden');
}

/* ---------------- Eventos ---------------- */

els.loginForm.addEventListener('submit', login);

els.logoutBtn.addEventListener('click', () => logout('Sesión cerrada'));

els.form.addEventListener('submit', saveProduct);

els.cancelBtn.addEventListener('click', () => {
  resetForm();
  showToast('Edición cancelada', 'success');
});

els.reloadBtn.addEventListener('click', () => loadProducts());

els.searchInput.addEventListener('input', () => {
  clearTimeout(state.searchTimeout);
  state.searchTimeout = setTimeout(loadProducts, 350);
});

els.productsBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === 'edit') startEdit(id);
  if (action === 'delete') deleteProduct(id);
});

/* ---------------- Arranque ---------------- */

async function init() {
  els.loginEmail.value = 'admin@tienda.com';
  els.loginPassword.value = 'Admin123!';

  if (!state.token) return;

  try {
    // Verifica que el token guardado siga siendo válido
    const { body } = await request('/auth/me');
    state.user = body.data;
    enterApp();
  } catch {
    logout();
  }
}

init();
