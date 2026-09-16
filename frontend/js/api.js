// --- Sesión ------------------------------------------------------
function getToken() {
  return localStorage.getItem('pe_token');
}

function setSesion(token, usuario) {
  localStorage.setItem('pe_token', token);
  localStorage.setItem('pe_usuario', JSON.stringify(usuario));
}

function getUsuario() {
  const raw = localStorage.getItem('pe_usuario');
  return raw ? JSON.parse(raw) : null;
}

function cerrarSesion() {
  localStorage.removeItem('pe_token');
  localStorage.removeItem('pe_usuario');
  window.location.href = 'index.html';
}

function exigirSesion() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

// --- REST (ms-usuarios, ms-items, vía Gateway) --------------------
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      cerrarSesion();
      return;
    }
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data;
}

// --- GraphQL (ms-presupuestos, vía Gateway) -----------------------
async function graphqlFetch(query, variables) {
  const res = await fetch(`${API_BASE}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await res.json();

  if (payload.errors && payload.errors.length) {
    if (payload.errors[0].extensions?.code === 'UNAUTHENTICATED') {
      cerrarSesion();
      return;
    }
    throw new Error(payload.errors[0].message);
  }

  return payload.data;
}
