
//MODIFICAR PARA QUE INICIA LA BASE DE DATOS Y GURADE EN BASE DE DATOS 
const storage = {
  get: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });


function mostrarMensaje(texto) {
  alert(texto);
}





















//ABRIR LOGIN
function OpenInitSesion(){
  $('#InitCorreo').value = '';
  $('#InitContraseña').value = '';
  $('#InicioSesion').style.display = 'grid';
}
//ABRIR CREAR CUENTA
function OpenCrearCuenta(){
  $('#RegCorreo').value = '';
  $('#RegContraseña').value = '';
  $('#RegNombre').value = '';
  $('#CrearCuenta').style.display = 'grid';
}
//CERRAR VENTANAS
function CerrarModales() {
  $('#InicioSesion').style.display = 'none';
  $('#CrearCuenta').style.display = 'none';
}




//CERRA LOGIN
$('#CloseSesionBtn').onclick = () => $('#InicioSesion').style.display = 'none';
//CERRAR CREAR CUENTA
$('#CerrarCrearBtn').onclick = () => $('#CrearCuenta').style.display = 'none';



//Validacion de datos
function validarPassword(password) {
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexMayus = /[A-Z]/;
  const regexMinus = /[a-z]/;
  const regexNumero = /[0-9]/;

  let errores = [];

  if (!regexMayus.test(password)) errores.push("La contraseña debe tener mínimo 1 mayúscula.");
  if (!regexMinus.test(password)) errores.push("La contraseña debe tener mínimo 1 minúscula.");
  if (!regexNumero.test(password)) errores.push("La contraseña debe tener mínimo 1 número.");
  if (password.length < 8) errores.push(`Faltan ${8 - password.length} caracteres para alcanzar 8.`);

  return errores;
}








//INICIO DE SESION
$('#InitSesionBtn').onclick = async () => {
  const usuario = $('#InitCorreo').value.trim();
  const password = $('#InitContraseña').value.trim();

  if (!usuario || !password) {
    mostrarMensaje("❌ Ingresa tu usuario y contraseña.");
    return;
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    // P R O C E S A R   E L   J S O N   D E L   S E R V I D O R
    const result = await response.json(); 
    mostrarMensaje(result.mensaje);

    if (result.ok) {

      //ACTUALIZAR EL RENDER SEGUN EL ROL DE LA BASE DE DATOS
      //NO MODIFICAR ESTE SE ENCARGA DEL RENDERIZADO SEGUN EL ROL DE CADA PERFIL
      setRole(result.rol); // Usar el rol de la respuesta
      
      //OCULTAR MODAL O VENTANA
      CerrarModales();

    }
  } catch (error) {
    console.error('Error al enviar datos:', error);
    mostrarMensaje('⚠️ Error al conectar con el servidor.');
  }
};






//CREAR CUENTA
$('#CrearCuentaBtn').onclick = async () => {
  const RegUsuario = $('#RegCorreo').value.trim();
  const RegPassword = $('#RegContraseña').value.trim();
  const RegNombre = $('#RegNombre').value.trim();

  if (!RegUsuario || !RegPassword || !RegNombre) {
    mostrarMensaje("❌ Todos los campos son obligatorios.");
    return;
  }

  if (!validarPassword(RegPassword)) {
    mostrarMensaje("❌ La contraseña no cumple los requisitos.");
    return;
  }

  try {
    const respuesta = await fetch('/crearCuenta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ RegUsuario, RegPassword, RegNombre })
    });

    const result = await respuesta.json();
    mostrarMensaje(result.mensaje);

    if (result.ok) {
      // Cierra registro
      CerrarModales();

      // Abre login automáticamente
      OpenInitSesion();
    }

  } catch (error) {
    console.error("Error al crear cuenta:", error);
    mostrarMensaje("❌ Error de conexión con el servidor.");
  }
};






















// revisa que rol es y selecciona rol 
// MODIFICAR PARA QUE MUESTRE EL ROL QUE ESTA EN LA BASE DE DATOS SEGUN SU CORREO

const state = {
  role: 'Cliente',
  cart: [],
  filter: '',
  currentReview: null
};

// CAMBIO DE ROL CON EL SELECT 
// MODIFICAR PARA QUE USE EL ROL DE BASE DE DATOS

function setRole(r) {
  state.role = r;
  $('#cliente-app').hidden = r !== 'Cliente';
  $('#vendedor-app').hidden = r !== 'Vendedor';
  $('#admin-app').hidden = r !== 'Administrador';
}


// menú y carrito
function renderMenu() {
  const wrap = $('#menuGrid');
  wrap.innerHTML = '';
  let menu = storage.get('menu', []);
  if (state.filter) menu = menu.filter(m => m.category === state.filter);

  menu.forEach(m => {
    const card = document.createElement('article');
    card.className = 'card';
    
    // IMAGEN NEUTRAL PARA PALTILLOS SIN IMAGEN O NO CARGADOS
    const imgSrc = m.img || 'imagenes\RATATOUILLE.png ';
    const avgRating = m.reviews.length ? (m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length) : 0;

    // SECCION QUE AGREGA LOS PLATILLOS AL FRONT
    // SE DEBE AGREGAR LAS DIRECCIONES A LA BASE DE DATOS PARA EXTRAER LA INFORMACION DE CADA UNO
    card.innerHTML = `
      <img src="${imgSrc}" alt="${m.name}" onerror="this.onerror=null;this.src='imagenes\RATATOUILLE.png'">
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
 

//FUNCION PARA EL CARRITO
function renderCart() {
  const list = $('#cartList');
  // ESTTUS DEL CARRITO EN CASO DE ESTAR VACIO
  if (!state.cart.length) 
  { 
    list.textContent = 'Tu carrito está vacío'; $('#cartTotal').textContent = fmt(0); return; 
  }
  // ESTATUS DEL CARRITO AGREGANDO DATO
  list.innerHTML = '';
  state.cart.forEach(ci => {
    const row = document.createElement('div');
    row.className = 'row';
    // SEPARACION ENTRE PEDIDOS DEL CARRITO
    row.style.margin = '6px 0';
    // AGRAG NOMBRE DEL PRODUCTO + CANTIDAD + PREIO FINAL (CANTIDAD * PRECIO)
    row.innerHTML = `<span>${ci.name} × ${ci.qty}</span><strong>${fmt(ci.qty * ci.price)}</strong>`;
    // PERMITE QUE APARESCAN EN EL CARRITO
    list.appendChild(row);
  });
  // GENERA EL TOTAL DEL PEDIDO
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

// CLIENTE: Pedidos realizados 
function renderClientOrders() {
  const orders = storage.get('orders', []);

  // Insertar pedidos dentro del aside (bajo Confirmar pedido)
  const aside = document.querySelector('.aside .p');
  if (!aside) return;

  // Eliminar si ya existe
  const existing = document.getElementById('clientOrders');
  if (existing) existing.remove();

  const cont = document.createElement('div');
  cont.id = 'clientOrders';
  cont.style.marginTop = '12px';  

  // AGREGA SECION DE MIS PEDIDOS Y LOS PEDIDOS ORDENADOS
  cont.innerHTML = `
    <h3>Mis pedidos</h3>${orders.length? orders.map((o) => `
    
    <div class="card p" style="margin:8px 0">
      
      <strong>Pedido #${o.id}</strong> 
      
      <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      
      <div style="margin-top:6px"><strong>Total:</strong> ${fmt(o.total)}</div>
    
    </div>`).join('') : '<div class="muted">No has realizado pedidos todavía.</div>'}`;
  aside.appendChild(cont);
}


// RESEÑAS (modal) 
function openReviewModal()
{
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');
  $('#modalTitle').textContent = `Reseñas de ${prod.name}`;
  $('#reviewList').innerHTML = prod.reviews.length ? prod.reviews.map(r => `<div class="review-item"><strong>${r.user}:</strong> ${'⭐'.repeat(r.rating)} ${r.text}</div>`).join('') : '<div class="muted">Sin reseñas aún.</div>';
  $('#reviewInput').value = '';
  $('#reviewRating').value = '5';
  $('#reviewModal').style.display = 'grid';
}
$('#sendReviewBtn').onclick = () => 
{
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






// ---------- FILTROS ---------- 
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

























//seccion vendedores
//solo estados y avanzar
function estadoTexto(st) {
  return st === 'prep' ? 'En preparación' : st === 'ready' ? 'Listo' : st === 'done' ? 'Entregado' : st;
}

function renderOrdersSeller() {
  const wrap = $('#ordersGrid');
  wrap.innerHTML = '';
  const orders = storage.get('orders', []);
  
  // ESTATUS SI HAY PEDIDOS
  if (!orders.length) { wrap.innerHTML = '<div class="muted">No hay pedidos.</div>'; return; }
  orders.forEach(o => {
    // CREA UN ELEMENTO PARA EL PEDIDO
    const card = document.createElement('div');
    card.className = 'card p';
    // AGREGA NUMERO DE PEDIDO, ESTADO DEL PEDIDO
    card.innerHTML = `
      <strong>Pedido #${o.id}</strong> 

      <span class="status ${o.status}">${estadoTexto(o.status)}</span>
      
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
      
      <div class="row" style="gap:8px">
        <button class="btn" data-advance="${o.id}">Avanzar</button>
      </div>`;
    wrap.appendChild(card);
  });


  // BOTON PARA AVANZAE
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
























//seccion Administrador
//agregar y eliminar platillos
function renderAdminKpis() {
  const orders = storage.get('orders', []);
  const menu = storage.get('menu', []);
  const ventas = orders.filter(o => o.status === 'done').reduce((s, o) => s + o.total, 0);
  const ticket = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;
  // VENTAS
  $('#kpiVentas').textContent = fmt(ventas);
  // PEDIDOS
  $('#kpiPedidos').textContent = orders.length;
  // TICKET PROMEDIO
  $('#kpiTicket').textContent = fmt(ticket);
  // ARTICULOS EN MENU
  $('#kpiMenu').textContent = menu.length;
}

// AGREGAR PLATILLO
$('#addDishBtn').onclick = () => {
  // NOMBRE
  const name = $('#newName').value.trim();
  // PRECIO
  const price = parseFloat($('#newPrice').value);
  // IMAGEN (URL O DIRECCION)
  const img = $('#newImg').value.trim();
  // DESCRIPCION
  const desc = $('#newDesc').value.trim();
  // CATEGORIA
  const cat = $('#newCategory').value;
  // ALERTA EN CASO DE QUE NO SE COMPLETARON LOS CAMPO
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
  panel.innerHTML = `
    <h3>Eliminar platillo</h3>` + (menu.length ? menu.map(m => `

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
























// ---------- Render general ---------- 
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


// ---------- UI bindings ---------- 
$('#seedBtn').addEventListener('click', OpenInitSesion);
$('#RegistrarBtn').addEventListener('click',OpenCrearCuenta);
$('#checkoutBtn').addEventListener('click', checkout);

// ---------- Inicialización ---------- 
if (!localStorage.getItem('menu')){ 
  resetDemo();
}
else {
  // asegurar que role inicial coincide con el select
  //state.role = $('#roleSelect').value || 'cliente';
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
