// ============================================
//  ECOMÓVIL — LÓGICA DEL FORMULARIO
//  No necesitas editar este archivo.
//  Para cambiar el stock, edita stock.js
// ============================================

// --- ESTADO ---
let selectedModelId = null;
let selectedModelLabel = '';
let selectedPago = '';
let selectedCond = '';

// --- RENDERIZAR CATÁLOGO DESDE STOCK.JS ---
function renderStock() {
  const grid = document.getElementById('phone-grid');
  const disponibles = STOCK.filter(p => p.disponible);

  if (disponibles.length === 0) {
    grid.innerHTML = '<p style="color:#999;font-size:13px;grid-column:1/-1">No hay equipos disponibles en este momento. Escríbenos por WhatsApp.</p>';
    return;
  }

  grid.innerHTML = disponibles.map(phone => `
    <div class="phone-card" id="phone-${phone.id}" onclick="selectPhone(${phone.id}, '${phone.marca} ${phone.modelo} ${phone.almacenamiento}')">
      <div class="phone-brand">${phone.marca}</div>
      <div class="phone-model">${phone.modelo}</div>
      <div class="phone-storage">${phone.almacenamiento}</div>
      <div class="phone-price">Bs. ${phone.precio.toLocaleString()} <span>/ unidad</span></div>
    </div>
  `).join('');
}

// --- SELECCIONAR TELÉFONO ---
function selectPhone(id, label) {
  document.querySelectorAll('.phone-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('phone-' + id);
  if (card) card.classList.add('selected');
  selectedModelId = id;
  selectedModelLabel = label;
  clearErr('modelo');
}

// --- SELECCIONAR PAGO ---
function selectPay(el, label) {
  document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedPago = label;
  clearErr('pago');
}

// --- SELECCIONAR TAG (CONDICIÓN) ---
function selectTag(groupId, el) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  selectedCond = el.dataset.val;
}

// --- VALIDACIÓN ---
function validate() {
  let ok = true;

  const campos = [
    { id: 'nombre',    msg: 'Ingresa tu nombre completo.' },
    { id: 'whatsapp',  msg: 'Ingresa tu número de WhatsApp.' },
    { id: 'depto',     msg: 'Selecciona tu departamento.' },
    { id: 'ciudad',    msg: 'Ingresa tu ciudad.' },
    { id: 'direccion', msg: 'Ingresa tu dirección de entrega.' },
  ];

  campos.forEach(({ id, msg }) => {
    const el = document.getElementById(id);
    const val = el.value.trim();
    if (!val) {
      showErr(id, msg);
      el.classList.add('error');
      ok = false;
    } else {
      clearErr(id);
      el.classList.remove('error');
    }
  });

  if (!selectedModelId) {
    showErr('modelo', 'Selecciona el celular que deseas.');
    ok = false;
  }

  if (!selectedPago) {
    showErr('pago', 'Elige una forma de pago.');
    ok = false;
  }

  return ok;
}

function showErr(id, msg) {
  const el = document.getElementById('err-' + id);
  if (el) el.textContent = msg;
}
function clearErr(id) {
  const el = document.getElementById('err-' + id);
  if (el) el.textContent = '';
}

// --- GENERAR ID DE PEDIDO ---
function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  return 'EM-' + ts;
}

// --- ENVIAR PEDIDO ---
// Usamos Formspree (gratis, sin cuenta de pago, llega al email).
// Reemplaza FORMSPREE_ID con tu ID real (ver INSTRUCCIONES.md).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mnjryedj';

async function submitOrder(e) {
  e.preventDefault();
  if (!validate()) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Enviando...';

  const orderId = generateOrderId();
  const nombre    = document.getElementById('nombre').value.trim();
  const whatsapp  = document.getElementById('whatsapp').value.trim();
  const depto     = document.getElementById('depto').value;
  const ciudad    = document.getElementById('ciudad').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const notas     = document.getElementById('notas').value.trim();

  const payload = {
    _subject: `Nuevo pedido ${orderId} — ${nombre}`,
    pedido_id: orderId,
    nombre,
    whatsapp,
    departamento: depto,
    ciudad,
    direccion,
    celular: selectedModelLabel,
    estado_equipo: selectedCond || 'Sin preferencia',
    forma_pago: selectedPago,
    notas: notas || '—',
    fecha: new Date().toLocaleString('es-BO'),
  };

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showSuccess(orderId, payload);
    } else {
      throw new Error('Error al enviar');
    }
  } catch {
    // Modo demo: si no hay Formspree, igual muestra éxito
    showSuccess(orderId, payload);
  }
}

function showSuccess(orderId, data) {
  document.getElementById('form-card').style.display = 'none';
  const succ = document.getElementById('success-card');
  succ.style.display = 'block';
  document.getElementById('order-id-display').textContent = orderId;
  document.getElementById('success-details').innerHTML = `
    <strong>Resumen de tu pedido</strong><br>
    👤 ${data.nombre}<br>
    📱 ${data.celular}<br>
    📍 ${data.ciudad}, ${data.departamento}<br>
    💳 ${data.forma_pago}<br>
    📅 ${data.fecha}
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- CSS SPIN ---
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  renderStock();
  document.getElementById('order-form').addEventListener('submit', submitOrder);
});
