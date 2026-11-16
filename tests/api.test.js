import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

const tempDir = await mkdtemp(path.join(tmpdir(), 'crud-productos-'));
process.env.NODE_ENV = 'test';
process.env.DB_FILE = path.join(tempDir, 'db.json');
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.PORT = '0';

const { createApp } = await import('../src/app.js');
const { seedDatabase } = await import('../src/database/seed.js');

let server;
let baseUrl;
let token;
let productId;

const credentials = {
  email: 'admin@tienda.com',
  password: 'Admin123!',
};

async function api(pathname, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    headers: response.headers,
  };
}

const authHeaders = () => ({ Authorization: `Bearer ${token}` });

before(async () => {
  await seedDatabase({ silent: true });
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections?.();
  });
  await rm(tempDir, { recursive: true, force: true });
});

describe('POST /api/auth/login', () => {
  it('devuelve un JWT con credenciales validas', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });

    assert.equal(status, 200);
    assert.equal(body.data.tokenType, 'Bearer');
    assert.equal(typeof body.data.token, 'string');
    assert.equal(body.data.user.email, credentials.email);

    token = body.data.token;
  });

  it('responde 401 con contrasena incorrecta', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: { ...credentials, password: 'incorrecta123' },
    });

    assert.equal(status, 401);
    assert.equal(body.error.status, 401);
  });

  it('responde 400 cuando faltan campos', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: {},
    });

    assert.equal(status, 400);
    assert.ok(Array.isArray(body.error.details));
    assert.ok(body.error.details.length >= 2);
  });
});

describe('GET /api/productos (publico)', () => {
  it('lista los productos con metadatos de paginacion', async () => {
    const { status, body } = await api('/api/productos');

    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.equal(typeof body.meta.total, 'number');
  });

  it('respeta el limite de paginacion', async () => {
    const { status, body } = await api('/api/productos?page=1&limit=2');

    assert.equal(status, 200);
    assert.ok(body.data.length <= 2);
    assert.equal(body.meta.limit, 2);
  });

  it('filtra por texto de busqueda', async () => {
    const { status, body } = await api('/api/productos?search=mouse');

    assert.equal(status, 200);
    assert.ok(body.data.length >= 1);
    assert.match(body.data[0].nombre.toLowerCase(), /mouse/);
  });

  it('responde 400 con parametros invalidos', async () => {
    const { status, body } = await api('/api/productos?limit=5000');

    assert.equal(status, 400);
    assert.equal(body.error.status, 400);
  });
});

describe('GET /api/productos/:id (publico)', () => {
  it('devuelve el detalle de un producto existente', async () => {
    const list = await api('/api/productos?limit=1');
    const { id } = list.body.data[0];

    const { status, body } = await api(`/api/productos/${id}`);

    assert.equal(status, 200);
    assert.equal(body.data.id, id);
  });

  it('responde 404 si el producto no existe', async () => {
    const { status, body } = await api(`/api/productos/${randomUUID()}`);

    assert.equal(status, 404);
    assert.equal(body.error.status, 404);
  });

  it('responde 400 si el id no es un UUID', async () => {
    const { status, body } = await api('/api/productos/123');

    assert.equal(status, 400);
    assert.equal(body.error.details[0].campo, 'id');
  });
});

describe('POST /api/productos (protegido)', () => {
  it('responde 401 sin token', async () => {
    const { status } = await api('/api/productos', {
      method: 'POST',
      body: { nombre: 'Producto sin token', precio: 1000 },
    });

    assert.equal(status, 401);
  });

  it('responde 401 con token invalido', async () => {
    const { status } = await api('/api/productos', {
      method: 'POST',
      body: { nombre: 'Producto token malo', precio: 1000 },
      headers: { Authorization: 'Bearer token.falso.invalido' },
    });

    assert.equal(status, 401);
  });

  it('responde 400 con datos invalidos', async () => {
    const { status, body } = await api('/api/productos', {
      method: 'POST',
      body: { nombre: 'ab', precio: -50, stock: -3 },
      headers: authHeaders(),
    });

    assert.equal(status, 400);
    const campos = body.error.details.map((detail) => detail.campo);
    assert.ok(campos.includes('nombre'));
    assert.ok(campos.includes('precio'));
    assert.ok(campos.includes('stock'));
  });

  it('crea el producto y responde 201 con Location', async () => {
    const payload = {
      nombre: 'Producto de prueba',
      descripcion: 'Creado desde las pruebas automatizadas',
      precio: 25000.5,
      stock: 7,
      categoria: 'Pruebas',
    };

    const { status, body, headers } = await api('/api/productos', {
      method: 'POST',
      body: payload,
      headers: authHeaders(),
    });

    assert.equal(status, 201);
    assert.equal(body.data.nombre, payload.nombre);
    assert.equal(body.data.precio, payload.precio);
    assert.equal(body.data.activo, true);
    assert.match(headers.get('location'), /\/api\/productos\/[\w-]+$/);

    // se reutiliza en las pruebas de actualizacion y borrado
    productId = body.data.id;
  });
});

describe('PUT /api/productos/:id (protegido)', () => {
  it('actualiza los campos enviados', async () => {
    const { status, body } = await api(`/api/productos/${productId}`, {
      method: 'PUT',
      body: { precio: 31000, stock: 3 },
      headers: authHeaders(),
    });

    assert.equal(status, 200);
    assert.equal(body.data.precio, 31000);
    assert.equal(body.data.stock, 3);
    assert.equal(body.data.nombre, 'Producto de prueba');
  });

  it('responde 400 si no se envia ningun campo', async () => {
    const { status } = await api(`/api/productos/${productId}`, {
      method: 'PUT',
      body: {},
      headers: authHeaders(),
    });

    assert.equal(status, 400);
  });

  it('responde 404 si el producto no existe', async () => {
    const { status } = await api(`/api/productos/${randomUUID()}`, {
      method: 'PUT',
      body: { precio: 100 },
      headers: authHeaders(),
    });

    assert.equal(status, 404);
  });

  it('responde 401 sin token', async () => {
    const { status } = await api(`/api/productos/${productId}`, {
      method: 'PUT',
      body: { precio: 100 },
    });

    assert.equal(status, 401);
  });
});

describe('DELETE /api/productos/:id (protegido)', () => {
  it('responde 401 sin token', async () => {
    const { status } = await api(`/api/productos/${productId}`, { method: 'DELETE' });

    assert.equal(status, 401);
  });

  it('elimina el producto y responde 204', async () => {
    const { status, body } = await api(`/api/productos/${productId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    assert.equal(status, 204);
    assert.equal(body, null);
  });

  it('el producto eliminado ya no existe (404)', async () => {
    const { status } = await api(`/api/productos/${productId}`);

    assert.equal(status, 404);
  });

  it('responde 404 al eliminar un producto inexistente', async () => {
    const { status } = await api(`/api/productos/${randomUUID()}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    assert.equal(status, 404);
  });
});

describe('CORS', () => {
  it('incluye la cabecera Access-Control-Allow-Origin', async () => {
    const { headers } = await api('/api/productos');
    assert.equal(headers.get('access-control-allow-origin'), '*');
  });

  it('responde al preflight OPTIONS', async () => {
    const response = await fetch(`${baseUrl}/api/productos`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });

    assert.equal(response.status, 204);
    assert.ok(response.headers.get('access-control-allow-methods').includes('POST'));
  });
});

describe('Rutas inexistentes', () => {
  it('responde 404 con JSON', async () => {
    const { status, body } = await api('/api/no-existe');
    assert.equal(status, 404);
    assert.equal(body.error.status, 404);
  });
});

describe('Formulario web', () => {
  it('sirve el formulario CRUD en la raíz', async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(html, /Catálogo de Productos/);
    assert.match(html, /id="productForm"/);
  });
});
