// ----------------- HELPERS -----------------
// Objeto para manejar localStorage de forma segura
const storage = {
  // Obtener un valor de localStorage y parsearlo; si no existe devuelve un valor por defecto
  get: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } },
  // Guardar un valor en localStorage convirtiéndolo a JSON
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

// Selector rápido de elementos en el DOM
const $ = s => document.querySelector(s);

// Formateo de números como moneda mexicana
const fmt = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

// ----------------- ESTADO GLOBAL -----------------
// Estado global de la app
const state = {
  role: 'Cliente',    // Rol actual: Cliente / Vendedor / Administrador
  cart: [],           // Carrito de compras del cliente
  filter: '',         // Filtro de categoría activo
  currentReview: null // ID del platillo actualmente revisado
};

// ----------------- LOGIN -----------------
// Muestra el modal de inicio de sesión
function OpenInitSesion() {
  $('#InitCorreo').value = '';
  $('#InitContraseña').value = '';
  $('#InicioSesion').style.display = 'grid';
}

// Botón de iniciar sesión
$('#InitSesionBtn').onclick = async () => {
  const usuario = $('#InitCorreo').value.trim();
  const password = $('#InitContraseña').value.trim();
  if (!usuario || !password) { alert('⚠️ Completa todos los campos'); return; }

  try {
    // Petición al servidor para autenticar
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const result = await response.json();

    if (result.ok) {
      alert(result.mensaje);                // Mensaje de éxito
      $('#InicioSesion').style.display = 'none'; // Ocultar modal
      setRole(result.rol);                  // Actualizar rol según BD
      renderAll();                          // Renderizar toda la interfaz
      checkSession();                       // Actualiza botón de sesión si aplica
    } else alert(`❌ Error: ${result.mensaje}`);
  } catch (err) {
    console.error(err);
    alert('⚠️ Error al conectar con el servidor');
  }
};

// Cerrar modal de inicio de sesión
$('#CloseSesionBtn').onclick = () => $('#InicioSesion').style.display = 'none';

// ----------------- ROL -----------------
// Cambia la UI según el rol actual
function setRole(r) {
  state.role = r;
  $('#cliente-app').hidden = r !== 'Cliente';
  $('#vendedor-app').hidden = r !== 'Vendedor';
  $('#admin-app').hidden = r !== 'Administrador';
}

// ----------------- MENÚ -----------------
// Renderiza los platillos en la UI
function renderMenu() {
  const wrap = $('#menuGrid');
  wrap.innerHTML = '';

  let menu = storage.get('menu', []);
  if (!menu || !menu.length) { wrap.innerHTML = '<div class="muted">No hay productos disponibles</div>'; return; }

  // Filtrar por categoría si hay filtro activo
  if (state.filter) menu = menu.filter(m => m.category === state.filter);

  menu.forEach(m => {
    const card = document.createElement('article');
    card.className = 'card';
    const imgSrc = m.img || 'imagenes/RATATOUILLE.png';
    const avgRating = m.reviews.length ? (m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length) : 0;

    // HTML de cada platillo
    card.innerHTML = `
      <img src="${imgSrc}" alt="${m.name}" onerror="this.onerror=null;this.src='imagenes/RATATOUILLE.png'">
      <div class="p">
        <div class="muted">${m.available ? 'Disponible' : 'Agotado'}</div>
        <h3>${m.name}</h3>
        <div class="muted">${m.desc}</div>
        <div>${m.category ? '<span class="category">' + m.category + '</span>' : ''}</div>
        <div>⭐ ${avgRating.toFixed(1)} (${m.reviews.length})</div>
        <div class="row" style="justify-content:space-between;margin-top:8px">
          <div class="price">${fmt(m.price)}</div>
          <button class="btn" ${!m.available ? 'disabled' : ''} data-add="${m.id}">Añadir</button>
          <button class="btn acc" data-review="${m.id}">Reseñas</button>
        </div>
      </div>`;
    wrap.appendChild(card);
  });

  // Delegación para botones de añadir al carrito o ver reseñas
  wrap.onclick = (e) => {
    const addId = e.target.dataset.add;
    const reviewId = e.target.dataset.review;
    if (addId) {
      const item = storage.get('menu', []).find(x => x.id == addId); if (!item) return;
      const found = state.cart.find(ci => ci.id == item.id);
      if (found) found.qty++; else state.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
      renderCart(); // Actualiza carrito
    } else if (reviewId) {
      state.currentReview = parseInt(reviewId);
      openReviewModal(); // Abre modal de reseñas
    }
  };
}

// ----------------- CARRITO -----------------
// Renderiza el carrito del cliente
function renderCart() {
  const list = $('#cartList');
  if (!state.cart.length) { list.textContent = 'Tu carrito está vacío'; $('#cartTotal').textContent = fmt(0); return; }
  list.innerHTML = '';
  state.cart.forEach(ci => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.margin = '6px 0';
    row.innerHTML = `<span>${ci.name} × ${ci.qty}</span><strong>${fmt(ci.qty * ci.price)}</strong>`;
    list.appendChild(row);
  });
  const total = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  $('#cartTotal').textContent = fmt(total);
}

// Realiza el checkout y guarda el pedido
function checkout() {
  if (!state.cart.length) return alert('Carrito vacío');
  const orders = storage.get('orders', []);
  const id = (orders.at(-1)?.id || 0) + 1;
  const total = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  orders.push({ id, items: JSON.parse(JSON.stringify(state.cart)), status: 'prep', total });
  storage.set('orders', orders);
  state.cart = [];
  renderCart();
  renderOrdersSeller();
  renderClientOrders();
  renderAdminKpis();
  alert('Pedido confirmado');
}

// ----------------- PEDIDOS CLIENTE -----------------
// Renderiza los pedidos realizados por el cliente
function renderClientOrders() {
  const orders = storage.get('orders', []);
  const leftColumn = $('#menuGrid')?.parentElement;
  if (!leftColumn) return;
  const existing = $('#clientOrders'); if (existing) existing.remove();

  const cont = document.createElement('div');
  cont.id = 'clientOrders'; cont.style.marginTop = '12px';
  cont.innerHTML = `<h3>Mis pedidos</h3>` + (orders.length ? orders.map(o => `
    <div class="card p" style="margin:8px 0">
      <strong>Pedido #${o.id}</strong>
      <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      <div style="margin-top:6px"><strong>Total:</strong> ${fmt(o.total)}</div>
    </div>`).join('') : '<div class="muted">No has realizado pedidos todavía.</div>');
  leftColumn.appendChild(cont);
}

// ----------------- RESEÑAS -----------------
// Modal para ver y agregar reseñas
function openReviewModal() {
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');
  $('#modalTitle').textContent = `Reseñas de ${prod.name}`;
  $('#reviewList').innerHTML = prod.reviews.length ? prod.reviews.map(r => `<div class="review-item"><strong>${r.user}:</strong> ${'⭐'.repeat(r.rating)} ${r.text}</div>`).join('') : '<div class="muted">Sin reseñas aún.</div>';
  $('#reviewInput').value = '';
  $('#reviewRating').value = '5';
  $('#reviewModal').style.display = 'grid';
}

// Botón para enviar reseña
$('#sendReviewBtn').onclick = () => {
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');
  const text = $('#reviewInput').value.trim();
  const rating = parseInt($('#reviewRating').value || '5');
  if (!text) return alert('Escribe un comentario');
  prod.reviews.push({ user: 'Cliente', rating, text });
  storage.set('menu', menu);
  openReviewModal(); // Reabre modal actualizado
  renderMenu();      // Actualiza UI
};

$('#closeReviewBtn').onclick = () => $('#reviewModal').style.display = 'none';

// ----------------- FILTROS -----------------
// Renderiza botones de filtrado por categoría
function renderFilters() {
  const wrap = $('#filterBar');
  wrap.innerHTML = '';
  const menu = storage.get('menu', []);
  const cats = [...new Set(menu.map(m => m.category).filter(Boolean))];
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.className = 'filter-btn';
    if (state.filter === c) btn.classList.add('active');
    btn.onclick = () => { state.filter = state.filter === c ? '' : c; renderFilters(); renderMenu(); };
    wrap.appendChild(btn);
  });
}

// ----------------- PEDIDOS VENDEDOR -----------------
function estadoTexto(st) {
  return st === 'prep' ? 'En preparación' : st === 'ready' ? 'Listo' : st === 'done' ? 'Entregado' : st;
}

// Renderiza pedidos para el vendedor
function renderOrdersSeller() {
  const wrap = $('#ordersGrid'); wrap.innerHTML = '';
  const orders = storage.get('orders', []);
  if (!orders.length) { wrap.innerHTML = '<div class="muted">No hay pedidos.</div>'; return; }
  orders.forEach(o => {
    const card = document.createElement('div'); card.className = 'card p';
    card.innerHTML = `
      <strong>Pedido #${o.id}</strong> 
      <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      <div class="row" style="gap:8px">
        <button class="btn" data-advance="${o.id}">Avanzar</button>
      </div>`;
    wrap.appendChild(card);
  });

  // Avanzar estado de pedido (prep -> ready -> done)
  wrap.onclick = (e) => {
    const idAdv = e.target.dataset.advance;
    if (!idAdv) return;
    const orders = storage.get('orders', []);
    const o = orders.find(x => x.id == idAdv);
    if (!o) return;
    if (o.status === 'prep') o.status = 'ready';
    else if (o.status === 'ready') o.status = 'done';
    storage.set('orders', orders);
    renderOrdersSeller();
    renderClientOrders();
    renderAdminKpis();
  };
}

// ----------------- ADMIN -----------------
// KPIs para administrador
function renderAdminKpis() {
  const orders = storage.get('orders', []);
  const menu = storage.get('menu', []);
  const ventas = orders.filter(o => o.status === 'done').reduce((s, o) => s + o.total, 0);
  const ticket = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;
  $('#kpiVentas').textContent = fmt(ventas);
  $('#kpiPedidos').textContent = orders.length;
  $('#kpiTicket').textContent = fmt(ticket);
  $('#kpiMenu').textContent = menu.length;
}

// Agregar platillo al menú
$('#addDishBtn').onclick = () => {
  const name = $('#newName').value.trim();
  const price = parseFloat($('#newPrice').value);
  const img = $('#newImg').value.trim();
  const desc = $('#newDesc').value.trim();
  const cat = $('#newCategory').value;
  if (!name || !(price >= 0)) return alert('Completa todos los campos (nombre y precio)');
  const menu = storage.get('menu', []);
  const id = (menu.at(-1)?.id || 0) + 1;
  menu.push({ id, name, price, available: true, desc, img: img || `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`, category: cat, reviews: [] });
  storage.set('menu', menu);
  $('#newName').value = ''; $('#newPrice').value = ''; $('#newImg').value = ''; $('#newDesc').value = ''; $('#newCategory').value = '';
  renderMenu(); renderFilters(); renderAdminMenuList(); renderAdminKpis();
};

// Renderiza lista de platillos con opción a eliminar
function renderAdminMenuList() {
  const menu = storage.get('menu', []);
  const container = $('#adminMenuListContainer'); container.innerHTML = '';
  const panel = document.createElement('div'); panel.className = 'card p';
  panel.innerHTML = `<h3>Eliminar platillo</h3>` + (menu.length ? menu.map(m => `
    <div class="row" style="margin:4px 0; align-items:center; justify-content:space-between">
      <span style="flex:1">${m.name} (${fmt(m.price)})</span>
      <button class="btn ghost" data-del="${m.id}">Eliminar</button>
    </div>`).join('') : '<div class="muted">No hay platillos en el menú.</div>');
  container.appendChild(panel);

  // Delegación para eliminar platillo
  panel.onclick = (e) => {
    const id = e.target.dataset.del;
    if (!id) return;
    if (!confirm('¿Eliminar este platillo?')) return;
    let menu = storage.get('menu', []);
    menu = menu.filter(m => m.id != id);
    storage.set('menu', menu);
    renderMenu(); renderFilters(); renderAdminMenuList(); renderAdminKpis();
  };
}

// ----------------- CARGA DESDE MYSQL -----------------
// Trae los platillos desde el backend
async function cargarPlatillos() {
  try {
    const res = await fetch('/platillos');
    const platillos = await res.json();
    console.log('Platillos recibidos:', platillos);
    const menu = platillos.map(p => ({
      id: p.ID_PLATILLO,
      name: p.NOMBRE,
      price: parseFloat(p.PRECIO),
      available: !!p.DISPONIBLE,
      desc: p.DESCRIPCION,
      img: p.IMAGEN,
      category: p.CATEGORIA,
      reviews: []
    }));
    storage.set('menu', menu);
  } catch (err) {
    console.error('Error al cargar platillos:', err);
  }
}

// ----------------- RENDER GENERAL -----------------
function renderAll() {
  setRole(state.role);
  renderMenu();
  renderFilters();
  renderCart();
  renderOrdersSeller();
  renderAdminKpis();
  renderAdminMenuList();
  renderClientOrders();
}

// ----------------- INICIALIZACIÓN -----------------
window.onload = async () => {
  await cargarPlatillos(); // Trae los platillos desde el backend
  renderAll();              // Renderiza toda la UI
};

$('#seedBtn').addEventListener('click', OpenInitSesion);
$('#checkoutBtn').addEventListener('click', checkout);

// ----------------- ANIMACIÓN TEXTO -----------------
const text = "¡Pronto Estará Listo!";
const animatedText = document.getElementById('animatedText');
let i = 0;
function typeAnimation() {
  if (i < text.length) {
    const span = document.createElement('span');
    span.textContent = text[i];
    animatedText.appendChild(span);
    i++;
    setTimeout(typeAnimation, 100); // Velocidad de tipeo
  } else {
    setTimeout(() => {
      animatedText.innerHTML = "";
      i = 0;
      typeAnimation(); // Reinicia animación
    }, 3000);
  }
}
typeAnimation();
