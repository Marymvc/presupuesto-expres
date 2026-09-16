exigirSesion();

const usuario = getUsuario();
document.getElementById('nombreUsuario').textContent = usuario ? usuario.nombre : '';
document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

let catalogo = [];       // ítems del catálogo (ms-items)
let filas = [];          // filas que el usuario va agregando al presupuesto actual

const fmt = (n) => `Bs ${Number(n).toFixed(2)}`;

// ------------------------------------------------------------------
// Catálogo de ítems
// ------------------------------------------------------------------
async function cargarCatalogo() {
  catalogo = await apiFetch('/api/items');
  renderCatalogo();
}

function renderCatalogo() {
  const cont = document.getElementById('listaItems');

  if (!catalogo.length) {
    cont.innerHTML = '<div class="vacio">Todavía no agregaste ningún ítem.</div>';
    return;
  }

  cont.innerHTML = catalogo
    .map(
      (item) => `
      <div class="fila-item">
        <div>
          <div class="nombre">${escapeHtml(item.nombre)}</div>
          <div class="meta">${escapeHtml(item.categoria)} · ${escapeHtml(item.unidad)}</div>
        </div>
        <div class="precio mono">${fmt(item.costoUnitario)}</div>
        <button class="btn-texto" data-eliminar-item="${item.id}" title="Eliminar">✕</button>
      </div>`
    )
    .join('');

  cont.querySelectorAll('[data-eliminar-item]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await apiFetch(`/api/items/${btn.dataset.eliminarItem}`, { method: 'DELETE' });
      await cargarCatalogo();
    });
  });
}

document.getElementById('formNuevoItem').addEventListener('submit', async (e) => {
  e.preventDefault();

  await apiFetch('/api/items', {
    method: 'POST',
    body: {
      nombre: document.getElementById('itemNombre').value,
      categoria: document.getElementById('itemCategoria').value,
      unidad: document.getElementById('itemUnidad').value,
      costoUnitario: Number(document.getElementById('itemCosto').value),
    },
  });

  e.target.reset();
  await cargarCatalogo();
});

// ------------------------------------------------------------------
// Armador de presupuesto
// ------------------------------------------------------------------
function agregarFila() {
  if (!catalogo.length) {
    alert('Agrega al menos un ítem al catálogo antes de armar un presupuesto.');
    return;
  }
  filas.push({ itemId: catalogo[0].id, superficie: 1 });
  renderFilas();
}

function renderFilas() {
  const cont = document.getElementById('filasPresupuesto');

  if (!filas.length) {
    cont.innerHTML = '<div class="vacio">Agrega ítems del catálogo para armar el presupuesto.</div>';
    actualizarTotalPreview();
    return;
  }

  const opciones = (seleccionado) =>
    catalogo
      .map((it) => `<option value="${it.id}" ${it.id === seleccionado ? 'selected' : ''}>${escapeHtml(it.nombre)}</option>`)
      .join('');

  cont.innerHTML = filas
    .map((fila, i) => {
      const item = catalogo.find((it) => it.id === fila.itemId);
      const subtotal = item ? item.costoUnitario * fila.superficie : 0;
      return `
      <div class="fila-presupuesto">
        <select data-fila="${i}" data-campo="itemId">${opciones(fila.itemId)}</select>
        <input type="number" class="mono" min="0" step="0.01" value="${fila.superficie}" data-fila="${i}" data-campo="superficie" />
        <span class="mono meta">${item ? escapeHtml(item.unidad) : ''}</span>
        <span class="subtotal-fila mono">${fmt(subtotal)}</span>
        <button class="btn-texto" data-quitar-fila="${i}" title="Quitar">✕</button>
      </div>`;
    })
    .join('');

  cont.querySelectorAll('select[data-fila], input[data-fila]').forEach((el) => {
    el.addEventListener('input', (e) => {
      const i = Number(e.target.dataset.fila);
      const campo = e.target.dataset.campo;
      filas[i][campo] = campo === 'superficie' ? Number(e.target.value) : e.target.value;
      renderFilas();
    });
  });
  cont.querySelectorAll('[data-quitar-fila]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filas.splice(Number(btn.dataset.quitarFila), 1);
      renderFilas();
    });
  });

  actualizarTotalPreview();
}

function actualizarTotalPreview() {
  const total = filas.reduce((suma, fila) => {
    const item = catalogo.find((it) => it.id === fila.itemId);
    return suma + (item ? item.costoUnitario * fila.superficie : 0);
  }, 0);
  document.getElementById('totalPreview').textContent = fmt(total);
}

document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);

document.getElementById('btnGuardarPresupuesto').addEventListener('click', async () => {
  const nombre = document.getElementById('presupuestoNombre').value.trim();
  if (!nombre) return alert('Ponle un nombre al proyecto.');
  if (!filas.length) return alert('Agrega al menos una fila.');

  const items = filas.map((fila) => {
    const item = catalogo.find((it) => it.id === fila.itemId);
    return {
      descripcion: item.nombre,
      categoria: item.categoria,
      unidad: item.unidad,
      superficie: fila.superficie,
      costoUnitario: item.costoUnitario,
    };
  });

  const query = `
    mutation($nombre: String!, $items: [ItemInput!]!) {
      crearPresupuesto(nombre: $nombre, items: $items) {
        id
      }
    }
  `;

  await graphqlFetch(query, { nombre, items });

  document.getElementById('presupuestoNombre').value = '';
  filas = [];
  renderFilas();
  await cargarPresupuestos();
});

// ------------------------------------------------------------------
// Presupuestos guardados
// ------------------------------------------------------------------
async function cargarPresupuestos() {
  const query = `
    query {
      misPresupuestos {
        id
        nombre
        total
        totalEnLetras
        estado
        fecha
        subtotalesPorCategoria { categoria subtotal }
        items { descripcion categoria unidad superficie costoUnitario subtotal }
      }
    }
  `;
  const data = await graphqlFetch(query);
  renderPresupuestos(data ? data.misPresupuestos : []);
}

function renderPresupuestos(lista) {
  const cont = document.getElementById('listaPresupuestos');

  if (!lista.length) {
    cont.innerHTML = '<div class="vacio">Todavía no guardaste ningún presupuesto.</div>';
    return;
  }

  cont.innerHTML = lista
    .slice()
    .reverse()
    .map(
      (p) => `
      <div class="presupuesto-guardado">
        <div class="cabecera">
          <span class="nombre">${escapeHtml(p.nombre)}</span>
          <span class="estado">${escapeHtml(p.estado)}</span>
        </div>
        <div class="fecha">${new Date(p.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div class="mono" style="margin-top:0.4rem; font-weight:600; color:var(--verde-obra)">${fmt(p.total)}</div>
        <div class="meta" style="font-size:0.76rem; color:var(--grafito-suave)">${escapeHtml(p.totalEnLetras)}</div>
      </div>`
    )
    .join('');
}

// ------------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ------------------------------------------------------------------
(async function init() {
  await cargarCatalogo();
  await cargarPresupuestos();
})();
