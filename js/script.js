// ----------------- HELPERS -----------------
// Objeto para manejar localStorage de forma segura 
const storage = {
  // Obtener un valor de localStorage y parsearlo; si no existe devuelve un valor por defecto
  get: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } },
  // Guardar un valor en localStorage convirtiéndolo a JSON
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });


function mostrarMensaje(texto) {
  alert(texto);
}




























// revisa que rol es y selecciona rol 
// MODIFICAR PARA QUE MUESTRE EL ROL QUE ESTA EN LA BASE DE DATOS SEGUN SU CORREO

const state = {
  role: 'Invitado',
  cart: [], // Carrito de compras del cliente
  filter: '', // Filtro de categoría activo
  currentReview: null // ID del platillo actualmente revisado
};

// CAMBIO DE ROL CON EL SELECT 
// MODIFICAR PARA QUE USE EL ROL DE BASE DE DATOS

function setRole(r) {
  state.role = r;

  // Invitado: ve menú y carrito
  if (r === 'Invitado' || r === '' || !r) {
    //invitado si ve menu y carrito
    $('#cliente-app').hidden = false;

    //invitado no ve vendedor ni admin
    $('#vendedor-app').hidden = true;
    $('#admin-app').hidden = true;

    const clientOrders = document.querySelector('#clientOrders');
    if (clientOrders) clientOrders.remove();

    renderOptionSesion();
    return;
  }

  $('#cliente-app').hidden = r !== 'Cliente';
  $('#vendedor-app').hidden = r !== 'Vendedor';
  $('#admin-app').hidden = r !== 'Administrador';
  renderOptionSesion(); // 🔥 actualizar botones
}






























// ---------- BOTON DE INICIO SESION, CREAR, Cerrar ---------- 
// RENDERIZAR LOS BOTONES DE SESIÓN
function renderOptionSesion() {
  const barLogin = $('#OptionSesionBar');      // Iniciar Sesión
  const barRegister = $('#CrearSesionBar');    // Crear Sesión
  const barLogout = $('#CloseSesionBar');      // Cerrar Sesión
  const profileCard = $('#ProfileCard');       // Perfil

  const isLogged = (
    state.role === "Cliente" ||
    state.role === "Vendedor" ||
    state.role === "Administrador"
  );

  if (isLogged) {
    // Usuario logueado → solo mostrar Cerrar Sesión + perfil
    barLogin.style.display = "none";
    barRegister.style.display = "none";
    barLogout.style.display = "block";
    profileCard.style.display = "flex";

    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    const avatar = localStorage.getItem('selectedAvatar');
    $('#ProfileName').textContent = name;
    $('#ProfileRole').textContent = role;
    $('#ProfileAvatar').src = avatar;
  
  } else {
    // Usuario NO logueado → mostrar Iniciar Sesión y Crear Cuenta
    barLogin.style.display = "block";
    barRegister.style.display = "block";
    barLogout.style.display = "none";
    profileCard.style.display = "none";
  }
}










//CERRAR VENTANAS
function CerrarModales() {
  $('#InicioSesion').style.display = 'none';
  $('#CrearCuenta').style.display = 'none';
}










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


























// ----------------- LOGIN -----------------
// Muestra el modal de inicio de sesión
function OpenInitSesion(){
  $('#InitCorreo').value = '';
  $('#InitContraseña').value = '';
  $('#InicioSesion').style.display = 'grid';
}
//INICIO DE SESION
// Botón de iniciar sesión
$('#InitSesionBtn').onclick = async () => {
  const usuario = $('#InitCorreo').value.trim();
  const password = $('#InitContraseña').value.trim();

  if (!usuario || !password) {
    mostrarMensaje("⚠️ Por favor, completa todos los campos.");
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

      $('#InicioSesion').style.display = 'none'; // Ocultar modal
      
      try {
        const bw = await fetch('/bienvenido');
        const bwj = await bw.json();
        if (bwj.ok) {
          // Guardar en localStorage (para mostrar en header)
          localStorage.setItem('userName', bwj.usuario || usuario);
          localStorage.setItem('userRole', bwj.rol || result.rol || 'Cliente');
          
          if (bwj.imagen && bwj.imagen.trim() !== "") {
            localStorage.setItem('selectedAvatar', bwj.imagen);
          } else {
            localStorage.setItem('selectedAvatar', "imagenes_Perfiles/RATATOUILLE.png");
          }

          state.role = bwj.rol;
          state.role = bwj.rol || result.rol || 'Cliente';
        } else {
          // Fallback: usar rol de la respuesta y extraer nombre del mensaje si es posible
          const rol = result.rol || 'Cliente';
          state.role = rol;
          localStorage.setItem('userRole', rol);
          // intentar extraer nombre del mensaje (si vino "Bienvenido, NOMBRE")
          const m = result.mensaje || '';
          const match = m.match(/Bienvenido[, ]+\s*([^\n!]+)/i);
          if (match) localStorage.setItem('userName', match[1].trim());
        }
      } catch (err) {
        // Si falla /bienvenido, hacemos fallback con lo que nos devolvió login
        const rol = result.rol || 'Cliente';
        state.role = rol;
        localStorage.setItem('userRole', rol);
        const m = result.mensaje || '';
        const match = m.match(/Bienvenido[, ]+\s*([^\n!]+)/i);
      }
      
      //ACTUALIZAR EL RENDER SEGUN EL ROL DE LA BASE DE DATOS
      //NO MODIFICAR ESTE SE ENCARGA DEL RENDERIZADO SEGUN EL ROL DE CADA PERFIL
      setRole(result.rol); // Usar el rol de la respuesta
      renderAll(); // Renderizar toda la interfaz
      
      //OCULTAR MODAL O VENTANA
      CerrarModales();

    } else {
      alert(`❌ Error: ${result.mensaje}`);
      //document.body.innerHTML = result;
    }

  } catch (error) {
    console.error('Error al enviar datos:', error);
    mostrarMensaje('⚠️ Error al conectar con el servidor.');
  }
};
//CERRA LOGIN
$('#CloseSesionBtn').onclick = () => $('#InicioSesion').style.display = 'none';










//ABRIR CREAR CUENTA
function OpenCrearCuenta(){
  $('#RegCorreo').value = '';
  $('#RegContraseña').value = '';
  $('#RegNombre').value = '';
  $('#CrearCuenta').style.display = 'grid';
}
//CREAR CUENTA
$('#CrearCuentaBtn').onclick = async () => {
  const RegUsuario = $('#RegCorreo').value.trim();
  const RegPassword = $('#RegContraseña').value.trim();
  const RegNombre = $('#RegNombre').value.trim();

  if (!RegUsuario || !RegPassword || !RegNombre) {
    mostrarMensaje("❌ Todos los campos son obligatorios.");
    return;
  }

  const errores = validarPassword(RegPassword);
  if (errores.length > 0) {
    mostrarMensaje("❌ La contraseña no cumple los requisitos.");
    return;
  }

  // OPCIÓN A: guardamos avatar en localStorage (si se seleccionó) — no se envía al servidor
  const selectedAvatar = localStorage.getItem('selectedAvatar') || null;
  if (selectedAvatar) {
    // opcional: puedes guardar una referencia por correo si quisieras (no requerido)
    // Por ahora lo dejamos solo en localStorage
  }

  try {
    const respuesta = await fetch('/crearCuenta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        RegUsuario, 
        RegPassword, 
        RegNombre,
        RegAvatar: selectedAvatar // 🔥 Enviarlo al backend
      })
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
//CERRAR CREAR CUENTA
$('#CerrarCrearBtn').onclick = () => $('#CrearCuenta').style.display = 'none';










//CERRAR SESION 
$('#CloseBtn').onclick = async () => {
  try {
    await fetch('/logout');
  } catch (err) {
    console.warn('Error al llamar /logout', err);
  }

  // Borrar rol a Invitado
  state.role = 'Invitado';
  storage.set("role", "Invitado");
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  localStorage.removeItem('selectedAvatar');


  // Ocultar secciones de usuario
  $('#cliente-app').hidden = false;
  $('#vendedor-app').hidden = true;
  $('#admin-app').hidden = true;

  /// Quitar “Mis pedidos” que es para clientes con cuenta
  const clientOrders = document.querySelector('#clientOrders');
  if (clientOrders) clientOrders.remove();

  // Actualizar botones y UI
  renderOptionSesion();
  renderMenu();
  renderCart();
  //renderOptionSesion();

  alert("Sesión cerrada correctamente.");
}






























// ----------------- MENÚ -----------------
// Renderiza los platillos en la UI
//RENDER MENU
function renderMenu() {
  const wrap = $('#menuGrid');
  wrap.innerHTML = '';

  let menu = storage.get('menu', []);
  
  
  if (!menu || !menu.length) { 
    wrap.innerHTML = '<div class="muted">No hay productos disponibles</div>'; 
    return; 
  }

  // Filtrar por categoría si hay filtro activo
  if (state.filter) {
    menu = menu.filter(m => m.category === state.filter);
  }

  menu.forEach(m => {
    const card = document.createElement('article');
    card.className = 'card';
    
    // IMAGEN NEUTRAL PARA PALTILLOS SIN IMAGEN O NO CARGADOS
    const imgSrc = (m.img && m.img !== 'null') ? `/imagenes/${m.img}` : '/imagenes/RATATOUILLE.png';





    const avgRating = m.reviews.length ? (m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length) : 0;

    // SECCION QUE AGREGA LOS PLATILLOS AL FRONT
    // SE DEBE AGREGAR LAS DIRECCIONES A LA BASE DE DATOS PARA EXTRAER LA INFORMACION DE CADA UNO
    //HTML de cada platillo
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










  // Delegation para botonos de añadir al carrito o ver reseñas
  wrap.onclick = (e) => {
    const addId = e.target.dataset.add;
    const reviewId = e.target.dataset.review;
    if (addId) {
      const item = storage.get('menu', []).find(x => x.id == addId); 
      if (!item) return;
      
      const found = state.cart.find(ci => ci.id == item.id);
      if (found) found.qty++;
      else state.cart.push({ 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        qty: 1 
      });
      renderCart();
    } else if (reviewId) {
      state.currentReview = parseInt(reviewId);
      openReviewModal(); //abre modal reseñas
    }
  };
}
 





























// ----------------- CARRITO -----------------
// Renderiza el carrito del cliente
function renderCart() {
  const list = $('#cartList');
  // ESTTUS DEL CARRITO EN CASO DE ESTAR VACIO
  if (!state.cart.length) 
  { 
    list.textContent = 'Tu carrito está vacío'; 
    $('#cartTotal').textContent = fmt(0); 
    return; 
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










//realiza el checkout y guarda el pedido
function checkout() {
  if (!state.cart.length) return alert('Carrito vacío');

  // Si hay sesión en servidor (cookie), preferible enviar pedido al backend
  // Pero aquí mantendremos tu comportamiento local (storage) y además intentamos POST a /pedido
  const items = state.cart.map(i => ({ id: i.id, qty: i.qty, price: i.price }));
  (async () => {
    try {
      const res = await fetch('/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const j = await res.json();
      if (j.ok) {
        // limpiar carrito local y actualizar UI
        state.cart = [];
        renderCart();
        renderOrdersSeller();
        renderClientOrders();
        renderAdminKpis();
        alert('Pedido confirmado');
        return;
      } else {
        // si no se guardó en servidor, fallback a almacenamiento local (como antes)
        console.warn('No se confirmó en servidor:', j.mensaje);
      }
    } catch (err) {
      console.warn('Error al enviar pedido al servidor, usando fallback local', err);
    }

    // Fallback local (igual que antes)
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
    alert('Pedido guardado localmente (offline).');
  })();
}





























// ----------------- PEDIDOS CLIENTE -----------------
// Renderiza los pedidos realizados por el cliente
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






























// ----------------- RESEÑAS -----------------
// Modal para ver y agregar reseñas
async function openReviewModal() {
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');

  $('#modalTitle').textContent = `Reseñas de ${prod.name}`;
  $('#reviewList').innerHTML = '<div class="muted">Cargando reseñas...</div>';

  try {
    const res = await fetch(`/resenas/${prod.id}`);
    const data = await res.json();

    if (!data.ok) {
      $('#reviewList').innerHTML = '<div class="muted">Error al cargar reseñas</div>';
      return;
    }

    if (data.reseñas.length === 0) {
      $('#reviewList').innerHTML = '<div class="muted">Sin reseñas aún.</div>';
    } else {
      $('#reviewList').innerHTML = data.reseñas.map(r => `
        <div class="review-item">
            <strong>${r.usuario}:</strong> 
            ${'⭐'.repeat(r.CALIFICACION)}<br>
            ${r.COMENTARIOS}
        </div>
      `).join('');
    }

  } catch (e) {
    console.error(e);
    $('#reviewList').innerHTML = '<div class="muted">Error al cargar reseñas</div>';
  }

  $('#reviewInput').value = '';
  $('#reviewRating').value = '5';
  $('#reviewModal').style.display = 'grid';
}
//Boton para enviar reseña
$('#sendReviewBtn').onclick = async () => {
  const menu = storage.get('menu', []);
  const prod = menu.find(m => m.id == state.currentReview);
  if (!prod) return alert('Producto no encontrado');

  const COMENTARIOS = $('#reviewInput').value.trim();
  const CALIFICACION = parseInt($('#reviewRating').value || '5');

  if(!COMENTARIOS) return alert('Escribe un comentario');

  console.log("ID_PLATILLO enviado:", prod.id);
  console.log("CALIFICACION enviada:", CALIFICACION);
  console.log("COMENTARIOS enviados:", COMENTARIOS);

  try {
    const res = await fetch('/resenas', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID_PLATILLO: prod.id,
        CALIFICACION: CALIFICACION,
        COMENTARIOS: COMENTARIOS
      })
    });

    const data = await res.json();
    alert(data.mensaje);

    openReviewModal();
    renderMenu();

  } catch (e) {
    alert("Error al enviar reseña al servidor");
    console.error(e);
  }
};
$('#closeReviewBtn').onclick = () => $('#reviewModal').style.display = 'none';






























// ----------------- PEDIDOS VENDEDOR -----------------
//seccion vendedores
//solo estados y avanzar
function estadoTexto(st) {
  return st === 'prep' ? 'En preparación' : st === 'ready' ? 'Listo' : st === 'done' ? 'Entregado' : st;
}

//renderiza pedidos para el vendedor
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
  // Avanzar estado de pedido (prep -> ready -> done)
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






























// ----------------- ADMIN -----------------
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
$('#addDishBtn').onclick = async () => {

  const name = $('#newName').value.trim();
  const price = parseFloat($('#newPrice').value);
  const desc = $('#newDesc').value.trim();
  const cat = $('#newCategory').value;
  const imgFile = $('#newImg').files[0];

  if (!name || !(price >= 0) || !desc || !cat || !imgFile) {
    return alert("Faltan campos — revisa nombre, precio, descripcion, categoría e imagen.");
  }

  const formData = new FormData();
  formData.append("nombre", name);
  formData.append("precio", price);
  formData.append("descripcion", desc);
  formData.append("categoria", cat);
  formData.append("imagen", imgFile); // ❗ nombre exacto como en multer

  const res = await fetch("/platillos", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  console.log("Respuesta backend:", data);

  alert(data.message);
};










// Renderiza lista de platillos con opción a eliminar
function renderAdminMenuList() {
  const menu = storage.get('menu', []);

  const container = $('#adminMenuListContainer');
  if (!container) return;
  container.innerHTML = ''; // limpio
  const panel = document.createElement('div');
  panel.className = 'card p';
  panel.innerHTML = `
    <h3>Eliminar platillo</h3>` + (menu.length ? menu.map(m => `

    <div class="row" style="margin:4px 0; align-items:center; justify-content:space-between">
      
      <span style="flex:1">${m.name} (${fmt(m.price)})</span>

      <button class="btn brand" data-edit="${m.id}">Editar</button>

      <button class="btn ghost" data-del="${m.id}">Eliminar</button>
    
      </div>`).join('') : '<div class="muted">No hay platillos en el menú.</div>');
  container.appendChild(panel);
  
  // abrir modal para editar
  panel.onclick = (e) => {
    const editId = e.target.dataset.edit;
    if (editId) {
      openEditDishModal(editId);
    }
  };

  // Delegación de eventos para eliminar
  panel.onclick = async (e) => {

    // 👉 BOTÓN ELIMINAR
    const delId = e.target.dataset.del;
    if (delId) {
      if (!confirm('¿Eliminar este platillo?')) return;

      try {
        const res = await fetch('/platillos/eliminar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: delId })
        });

        const data = await res.json();
        if (!data.ok) return alert('Error: ' + data.mensaje);

        // actualizar local
        let menu = storage.get('menu', []);
        menu = menu.filter(m => m.id != delId);
        storage.set('menu', menu);

        renderAdminMenuList();
        renderMenu();
        renderFilters();

        alert('Platillo eliminado.');
      } catch (error) {
        console.error(error);
      }

      return; // ← evitar que siga revisando
    }

    // 👉 BOTÓN EDITAR
    const editId = e.target.dataset.edit;
    if (editId) {
      console.log("EDITAR PLATILLO:", editId);
      openEditDishModal(editId);
      return;
    }
  };
}










let currentEditId = null;

function openEditDishModal(id) {
  currentEditId = id;
  const menu = storage.get('menu', []);
  const dish = menu.find(m => m.id == id);
  if (!dish) return alert("Platillo no encontrado");

  $('#editName').value = dish.name;
  $('#editPrice').value = dish.price;
  $('#editDesc').value = dish.desc;
  $('#editCategory').value = dish.category;

  $('#editDishModal').style.display = 'grid';
}










$('#saveEditBtn').onclick = async () => {
  const formData = new FormData();
  formData.append("id", currentEditId);
  formData.append("nombre", $('#editName').value.trim());
  formData.append("precio", $('#editPrice').value.trim());
  formData.append("descripcion", $('#editDesc').value.trim());
  formData.append("categoria", $('#editCategory').value.trim());

  const imgFile = $('#editImg').files[0];
  if (imgFile) formData.append("imagen", imgFile);

  const res = await fetch("/platillos/editar", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  alert(data.mensaje);

  if (data.ok) {
    await cargarPlatillos();
    renderAll();
    $('#editDishModal').style.display = 'none';
  }
};
$('#cancelEditBtn').onclick = () => {$('#editDishModal').style.display = 'none';};































// ----------------- CARGA DESDE MYSQL -----------------
// Trae los platillos desde el backend
async function cargarPlatillos() {
  try {
    const res = await fetch('/platillos');
    const platillos = await res.json();
    if (Array.isArray(platillos)) {
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
    } else {
      console.warn('Respuesta /platillos no es arreglo:', platillos);
    }
  } catch (err) {
    console.error('Error al cargar platillos:', err);
  }
}










// ---------- FILTROS ---------- 
function renderFilters() {
  const wrap = $('#filterBar');
  if (!wrap) return;
  wrap.innerHTML = '';
  const menu = storage.get('menu', []);
  const cats = [...new Set(menu.map(m => m.category).filter(Boolean))];
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.className = 'filter-btn';
    if (state.filter === c) btn.classList.add('active');
    btn.onclick = () => { 
      state.filter = state.filter === c ? '' : c;
      renderFilters(); 
      renderMenu(); 
    };
    wrap.appendChild(btn);
  });
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










// ---------- Inicialización ---------- 
window.onload = async () => {
  await cargarPlatillos(); // Trae los platillos desde el backend
  initAvatarSelector();
  // Verificar si hay sesión REAL en el servidor
  const bw = await fetch('/bienvenido');
  const session = await bw.json();

  if (!session.ok) {
    // Borrar cookie cliente si ya no es válida
    document.cookie = "token_sesion=; Max-Age=0; path=/;";
    // Si NO hay sesión válida, limpiar localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedAvatar');
    state.role = "Invitado";
  } else {
    // Sí hay sesión
    state.role = session.rol;
    localStorage.setItem('userName', session.usuario);
    localStorage.setItem('userRole', session.rol);
  }
  
  renderAll();// Renderiza toda la UI
  renderOptionSesion();              
};


// ---------- UI bindings ---------- 
$('#seedBtn').addEventListener('click', OpenInitSesion);
$('#RegistrarBtn').addEventListener('click',OpenCrearCuenta);
$('#checkoutBtn').addEventListener('click', checkout);










// ============== ANIMACION AVATAR ==============
// inicializa comportamiento de selección de avatar en el modal
function initAvatarSelector() {
  const selector = document.getElementById('avatarSelector');
  if (!selector) return;

  // limpiar estado visual si hubiera
  selector.querySelectorAll('img').forEach(img => {
    img.classList.remove('selected');
    img.style.border = "3px solid transparent";
  });

  selector.querySelectorAll('label').forEach(label => {
    const radio = label.querySelector('input[type="radio"]');
    const img = label.querySelector('img');
    if (!img) return;

    // si hay avatar guardado que coincida con src, marcarlo
    const saved = localStorage.getItem('selectedAvatar');
    if (saved && img.src && img.src.endsWith(saved)) {
      img.classList.add('selected');
      img.style.border = "3px solid var(--acc)";
      if (radio) radio.checked = true;
    }

    // click en la imagen o label selecciona el avatar
    const clickHandler = (ev) => {
      ev.preventDefault();
      if (radio) radio.checked = true;

      // quitar bordes a todos
      selector.querySelectorAll('img').forEach(i => {
        i.style.border = "3px solid transparent";
        i.classList.remove('selected');
      });

      // marcar el seleccionado visualmente
      img.style.border = "3px solid var(--acc)";
      img.classList.add('selected');

      // Guardar en localStorage la parte final del nombre (opción estable)
      // Guardamos el src completo para ser robustos
      try {
        localStorage.setItem('selectedAvatar', img.src);
      } catch (err) {
        console.warn('No se pudo guardar avatar en localStorage', err);
      }
    };

    label.addEventListener('click', clickHandler);
    img.addEventListener('click', clickHandler);
  });
}










// =========================================
//  MOSTRAR AVATAR Y DATOS EN EL HEADER
// =========================================
function refreshProfileHeaderFromStorage() {
  const avatar = localStorage.getItem("selectedAvatar");
  const name   = localStorage.getItem("userName");
  const role   = localStorage.getItem("userRole");

  if (name && role) {
    document.getElementById("ProfileCard") && (document.getElementById("ProfileCard").style.display = "flex");
    document.getElementById("OptionSesionBar") && (document.getElementById("OptionSesionBar").style.display = "none");
    document.getElementById("CrearSesionBar") && (document.getElementById("CrearSesionBar").style.display = "none");
    if (avatar) document.getElementById("ProfileAvatar") && (document.getElementById("ProfileAvatar").src = avatar);
    document.getElementById("ProfileName") && (document.getElementById("ProfileName").textContent = name);
    document.getElementById("ProfileRole") && (document.getElementById("ProfileRole").textContent = role);
  } else {
    // no mostrar perfil si falta info
    document.getElementById("ProfileCard") && (document.getElementById("ProfileCard").style.display = "none");
  }
}











// ----------------- ANIMACIÓN TEXTO -----------------
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
    }, 3000)
  }
}
typeAnimation();
