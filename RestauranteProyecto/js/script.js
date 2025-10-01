/* ---------- Helpers ---------- */
const storage = {
  get: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

/* ---------- Seed/demo data ---------- */
const seedData = () => ({
  menu: [
    { id: 1, name: "Tacos al pastor", price: 25, available: true, desc: "Con piña y salsa verde", img: "https://www.entornoturistico.com/wp-content/uploads/2023/02/3-tacos-al-pastor.jpeg", category: "Tacos", reviews: [{ user: "Ana", rating: 5, text: "Deliciosos!" }] },
    { id: 2, name: "Hamburguesa clásica", price: 89, available: true, desc: "Carne 150g, queso, jitomate", img: "https://imag.bonviveur.com/hamburguesa-clasica.jpg", category: "Hamburguesa", reviews: [{ user: "Sofia", rating: 5, text: "Llevare 3 mas!" }] },
    { id: 3, name: "Agua de horchata", price: 25, available: true, desc: "500 ml", img: "https://cdn7.kiwilimon.com/recetaimagen/31780/960x640/36562.jpg.jpg", category: "Bebida", reviews: [{ user: "Juan", rating: 5, text: "Volveria por mas ((:!" }] }
  ],
  orders: [],
  users: [{ id: 1, name: "Ana", role: "cliente", email: "ana@example.com" }]
});

function resetDemo() {
  const d = seedData();
  storage.set('menu', d.menu);
  storage.set('orders', d.orders);
  storage.set('users', d.users);
  state.cart = [];
  state.filter = '';
  state.currentReview = null;
  renderAll();
}

/* ---------- App state ---------- */
const state = {
  role: $('#roleSelect')?.value || 'cliente',
  cart: [],
  filter: '',
  currentReview: null
};

/* ---------- Role switching ---------- */
function setRole(r) {
  state.role = r;
  $('#cliente-app').hidden = r !== 'cliente';
  $('#vendedor-app').hidden = r !== 'vendedor';
  $('#admin-app').hidden = r !== 'admin';
}

/* ---------- CLIENTE: menú y carrito ---------- */
// ... (Todo el código que tenías en tu <script> se mantiene igual aquí)
function renderMenu() {
  const wrap = $('#menuGrid');
  wrap.innerHTML = '';
  let menu = storage.get('menu', []);
  if (state.filter) menu = menu.filter(m => m.category === state.filter);

  menu.forEach(m => {
    const card = document.createElement('article');
    card.className = 'card';
    // use onerror fallback to a neutral image
    const imgSrc = m.img || 'https://picsum.photos/seed/food/600/400';
    const avgRating = m.reviews.length ? (m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length) : 0;
    card.innerHTML = `
      <img src="${imgSrc}" alt="${m.name}" onerror="this.onerror=null;this.src='https://picsum.photos/seed/food/600/400'">
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

  // Delegation: único handler
  wrap.onclick = (e) => {
    const addId = e.target.dataset.add;
    const reviewId = e.target.dataset.review;
    if (addId) {
      const item = storage.get('menu', []).find(x => x.id == addId); if (!item) return;
      const found = state.cart.find(ci => ci.id == item.id);
      if (found) found.qty++;
      else state.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
      renderCart();
    } else if (reviewId) {
      state.currentReview = parseInt(reviewId);
      openReviewModal();
    }
  };
}

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

function checkout() {
  if (!state.cart.length) return alert('Carrito vacío');
  const orders = storage.get('orders', []);
  const id = (orders.at(-1)?.id || 0) + 1;
  const total = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  // empezar en 'prep' (En preparación)
  orders.push({ id, items: JSON.parse(JSON.stringify(state.cart)), status: 'prep', total });
  storage.set('orders', orders);
  state.cart = [];
  renderCart();
  renderOrdersSeller();
  renderClientOrders();
  renderAdminKpis();
  alert('Pedido confirmado');
}

/* ---------- CLIENTE: Pedidos realizados (mis pedidos) ---------- */
function renderClientOrders() {
  const orders = storage.get('orders', []);
  // insert below the menu (left column)
  const leftColumn = $('#menuGrid')?.parentElement;
  if (!leftColumn) return;
  const existing = $('#clientOrders');
  if (existing) existing.remove();

  const cont = document.createElement('div');
  cont.id = 'clientOrders';
  cont.style.marginTop = '12px';
  cont.innerHTML = `<h3>Mis pedidos</h3>` + (orders.length ? orders.map(o => `
    <div class="card p" style="margin:8px 0">
      <strong>Pedido #${o.id}</strong> 
      <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      <div style="margin-top:6px"><strong>Total:</strong> ${fmt(o.total)}</div>
    </div>`).join('') : '<div class="muted">No has realizado pedidos todavía.</div>');
  leftColumn.appendChild(cont);
}

/* ---------- RESEÑAS (modal) ---------- */
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
$('#sendReviewBtn').onclick = () => {
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');
  const text = $('#reviewInput').value.trim();
  const rating = parseInt($('#reviewRating').value || '5');
  if (!text) return alert('Escribe un comentario');
  prod.reviews.push({ user: 'Cliente', rating, text });
  storage.set('menu', menu);
  openReviewModal();
  renderMenu();
};
$('#closeReviewBtn').onclick = () => $('#reviewModal').style.display = 'none';

/* ---------- FILTROS ---------- */
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

/* ---------- VENDEDOR: solo estados y avanzar ---------- */
function estadoTexto(st) {
  return st === 'prep' ? 'En preparación' : st === 'ready' ? 'Listo' : st === 'done' ? 'Entregado' : st;
}
function renderOrdersSeller() {
  const wrap = $('#ordersGrid');
  wrap.innerHTML = '';
  const orders = storage.get('orders', []);
  if (!orders.length) { wrap.innerHTML = '<div class="muted">No hay pedidos.</div>'; return; }
  orders.forEach(o => {
    const card = document.createElement('div');
    card.className = 'card p';
    card.innerHTML = `<strong>Pedido #${o.id}</strong> <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      <div class="row" style="gap:8px">
        <button class="btn" data-advance="${o.id}">Avanzar</button>
      </div>`;
    wrap.appendChild(card);
  });

  // único handler de avance
  wrap.onclick = (e) => {
    const idAdv = e.target.dataset.advance;
    if (!idAdv) return;
    const orders = storage.get('orders', []);
    const o = orders.find(x => x.id == idAdv);
    if (!o) return;
    // ciclo: prep -> ready -> done (si ya es done, permanece)
    if (o.status === 'prep') o.status = 'ready';
    else if (o.status === 'ready') o.status = 'done';
    else o.status = 'done';
    storage.set('orders', orders);
    renderOrdersSeller();
    renderClientOrders();
    renderAdminKpis();
  };
}

/* ---------- ADMIN: KPIs, agregar y eliminar platillos ---------- */
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

$('#addDishBtn').onclick = () => {
  const name = $('#newName').value.trim();
  const price = parseFloat($('#newPrice').value);
  const img = $('#newImg').value.trim();
  const desc = $('#newDesc').value.trim();
  const cat = $('#newCategory').value;
  if (!name || !(price >= 0)) return alert('Completa todos los campos (nombre y precio). Si no tienes imagen, pega una URL o usa picsum).');
  const menu = storage.get('menu', []);
  const id = (menu.at(-1)?.id || 0) + 1;
  menu.push({ id, name, price, available: true, desc, img: img || `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`, category: cat, reviews: [] });
  storage.set('menu', menu);
  $('#newName').value = ''; $('#newPrice').value = ''; $('#newImg').value = ''; $('#newDesc').value = ''; $('#newCategory').value = '';
  renderMenu(); renderFilters(); renderAdminMenuList(); renderAdminKpis();
};

function renderAdminMenuList() {
  const menu = storage.get('menu', []);
  const container = $('#adminMenuListContainer');
  container.innerHTML = ''; // limpio
  const panel = document.createElement('div');
  panel.className = 'card p';
  panel.innerHTML = `<h3>Eliminar platillo</h3>` + (menu.length ? menu.map(m => `
    <div class="row" style="margin:4px 0; align-items:center; justify-content:space-between">
      <span style="flex:1">${m.name} (${fmt(m.price)})</span>
      <button class="btn ghost" data-del="${m.id}">Eliminar</button>
    </div>`).join('') : '<div class="muted">No hay platillos en el menú.</div>');
  container.appendChild(panel);

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

/* ---------- Render general ---------- */
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

/* ---------- UI bindings ---------- */
$('#roleSelect').addEventListener('change', e => { setRole(e.target.value); renderAll(); });
$('#seedBtn').addEventListener('click', resetDemo);
$('#checkoutBtn').addEventListener('click', checkout);

/* ---------- Inicialización ---------- */
if (!localStorage.getItem('menu')) resetDemo();
else {
  // asegurar que role inicial coincide con el select
  state.role = $('#roleSelect').value || 'cliente';
  renderAll();
}



const text = "¡Pronto Estara Listo!";
const animatedText = document.getElementById('animatedText');

let i = 0;
function typeAnimation() {
  if (i < text.length) {
    const span = document.createElement('span');
    span.textContent = text[i];
    animatedText.appendChild(span);
    i++;
    setTimeout(typeAnimation, 100); // velocidad letra a letra
  } else {
    // reinicia cada 3s
    setTimeout(() => {
      animatedText.innerHTML = "";
      i = 0;
      typeAnimation();
    }, 3000);
  }
}
typeAnimation();
