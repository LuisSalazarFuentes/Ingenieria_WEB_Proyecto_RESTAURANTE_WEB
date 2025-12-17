//Server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imagenes");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

//Script.j
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

const API_URL = "http://3.239.91.108:8080";

function mostrarMensaje(texto) {
  alert(texto);
}

// Parche: forzar credentials: "include" en TODOS los fetch
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  options.credentials = "include";
  return originalFetch(url, options);
};


//server.js

// Conexión MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'detodounpoco'
});

db.connect(err => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err);
    return;
  }
  console.log('✅ Conexión a MySQL exitosa');
});






































//------------------------SECCION CUENTAS-------------------------

// 🔥 LIMPIAR TOKEN DE SESIONES AL INICIAR EL SERVIDOR
function limpiarSesiones() {
  const query1 = 'UPDATE CUENTAS SET token_sesion = NULL';

  db.query(query1, err => {
    if (err) console.error('❌ Error al limpiar sesiones CUENTAS:', err);
    else console.log('🧹 Tokens limpiados en CUENTAS');
  });
} 

// Ejecutar limpieza cada vez que el servidor arranque
limpiarSesiones();

//Validación de usuario y password
function validarCredenciales(usuario, password) {
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexMayus = /[A-Z]/;
  const regexMinus = /[a-z]/;
  const regexNumero = /[0-9]/;

  let errores = [];

  if (!regexCorreo.test(usuario)) errores.push("El usuario debe ser un correo válido.");
  if (!regexMayus.test(password)) errores.push("La contraseña debe tener mínimo 1 mayúscula.");
  if (!regexMinus.test(password)) errores.push("La contraseña debe tener mínimo 1 minúscula.");
  if (!regexNumero.test(password)) errores.push("La contraseña debe tener mínimo 1 número.");
  if (password.length < 8) errores.push(`Faltan ${8 - password.length} caracteres para alcanzar 8.`);

  return errores;
}

app.post('/crearCuenta', (req, res) => {
  const { RegUsuario, RegPassword, RegNombre, RegAvatar } = req.body;

  if (!RegUsuario || !RegPassword || !RegNombre) {
    return res.json({
      ok: false,
      mensaje: "❌ Faltan datos para crear la cuenta."
    });
  }

  // 🔍 Revisar requisitos con la función que ya tienes
  const errores = validarCredenciales(RegUsuario, RegPassword);

  if (errores.length > 0) {
    return res.json({
      ok: false,
      mensaje: errores.join('\n')
    });
  }

  // 👍 Si todo está bien, revisar si el usuario ya existe
  const queryExiste = "SELECT * FROM CUENTAS WHERE EMAIL = ?";
  db.query(queryExiste, [RegUsuario], (err, results) => {
    if (err) {
      console.error("❌ Error al consultar CUENTAS:", err);
      return res.json({
        ok: false,
        mensaje: "Error interno del servidor."
      });
    }

    if (results.length > 0) {
      return res.json({
        ok: false,
        mensaje: "❌ Este correo ya está registrado."
      });
    }

    // Insertar en BD
    const queryInsert = "INSERT INTO CUENTAS (NOMBRE, EMAIL, PASSWORD,IMAGEN) VALUES (?, ?, ?, ?)";
    db.query(queryInsert, [RegNombre, RegUsuario, RegPassword, RegAvatar], (err2) => {
      if (err2) {
        console.error("❌ Error al crear cuenta:", err2);
        return res.json({
          ok: false,
          mensaje: "Error al registrar usuario."
        });
      }
      res.clearCookie('token_sesion');  // ← Limpia la sesión anterior EIMINAR LINEA O COMENTAR
      return res.json({
        ok: true,
        mensaje: `✅ Cuenta creada correctamente. Bienvenido, ${RegNombre}!`
      });
    });
  });
});

// Login con validación + generación de token
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.json({ 
      ok: false, 
      mensaje: '❌ Faltan datos en el formulario.' 
    });
  }

  // Validar formato
  const errores = validarCredenciales(usuario, password);
  if (errores.length > 0) {
    return res.json({
      ok: false,
      mensaje: errores.join('\n')
    });
  }

  // Buscar usuario
  const queryUser = 'SELECT * FROM CUENTAS WHERE EMAIL = ?';

  db.query(queryUser, [usuario], (err, results) => {
    if (err) {
      console.error('❌ Error al consultar CUENTAS:', err);
      return res.json({
        ok: false,
        mensaje: 'Error interno del servidor.'
      });
    }

    // Si no existe
    if (results.length === 0) {
      return res.json({
        ok: false,
        mensaje: '❌ Usuario no encontrado.'
      });
    }

    const user = results[0];

    // ⭐⭐⭐ NUEVO: Verificar si está activo ⭐⭐⭐
    if (user.ACTIVO === 0) {
      return res.json({
        ok: false,
        mensaje: '⚠️ Tu cuenta está deshabilitada. Contacta al administrador.'
      });
    }

    // Validar contraseña
    if (user.PASSWORD !== password) {
      return res.json({ 
        ok: false, 
        mensaje: '❌ Contraseña incorrecta.' 
      });
    }

    // Crear token
    const token = uuidv4();

    // Guardar token
    const sqlUpdate = 'UPDATE CUENTAS SET token_sesion = ? WHERE EMAIL = ?';
    db.query(sqlUpdate, [token, usuario], (err2) => {
      if (err2) {
        console.error('❌ Error al guardar token CUENTA:', err2);
        return res.json({ 
          ok: false, 
          mensaje: 'Error al guardar sesión.' 
        });
      }

      // Cookie token
      res.cookie('token_sesion', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10
      });

      // Cookie id
      res.cookie('id_cuenta', user.ID_CUENTA, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10
      });

      // Respuesta exitosa
      return res.json({
        ok: true,
        mensaje: `✅ Bienvenido, ${user.NOMBRE}!`,
        rol: user.ROL
      });
    });
  });
});


//ENTRAR EN LA BASE DE DATOS Y BUSCAR EL USUARIO
// Ruta protegida (requiere sesión)
// COMPROBAR SESIÓN
app.get('/bienvenido', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) {
    return res.json({ 
      ok: false, 
      mensaje: 'No hay sesión' 
    });
  }
  
  const query = 'SELECT NOMBRE, ROL, IMAGEN FROM CUENTAS WHERE token_sesion = ?';
  // ANTES  db.query(query, [token, token], (err, results) =>
  db.query(query, [token, ], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ 
        ok: false, 
        mensaje: 'Sesión no válida.' 
      });
    }
    const user = results[0];
    res.json({ 
      ok: true, 
      usuario: user.NOMBRE, 
      rol: user.ROL,
      imagen: user.IMAGEN // 🔥 Enviar avatar
    });
  });
});

// Cerrar sesión
app.get('/logout', async (req, res) => {
  const token = req.cookies.token_sesion;

  if (token) {
    try {
      // Borrar token en la BD
      await db.promise().query(
        'UPDATE CUENTAS SET token_sesion = NULL WHERE token_sesion = ?',
        [token]
      );

      // Borrar ambas cookies correctamente (misma configuración que login)
      res.clearCookie('token_sesion', {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/"
      });

      res.clearCookie('id_cuenta', {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/"
      });

    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  }

  res.json({ ok: true });
});







































//-----------------------seccion platillo-----------------------

//AGREGAR PLATILLOS BD 
app.post("/platillos", upload.single("imagen"), (req, res) => {


  if (!req.file) {
    return res.json({ error: "No se recibió ninguna imagen" });
  }

  const { nombre, precio, descripcion, categoria} = req.body;
  const imagen = req.file.filename;

  const sql = `
    INSERT INTO PLATILLOS (Nombre, precio, DESCRIPCION, categoria, IMAGEN)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, precio, descripcion, categoria, imagen], (err) => {
    if (err) return res.json({ error: err });

    res.json({ ok: true, message: "Platillo agregado correctamente" });
  });
});

//ELIMINAR LOS PLATILLOS DE LA BD 
app.post('/platillos/eliminar', (req, res) => {
  const { id } = req.body;
  if (!id) return res.json({ 
    ok: false, 
    mensaje: 'No se recibió ID del platillo' 
  });

  const sql = 'DELETE FROM PLATILLOS WHERE ID_PLATILLO = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar platillo:', err);
      return res.json({ 
        ok: false, 
        mensaje: 'Error al eliminar platillo en BD' 
      });
    }
    return res.json({ 
      ok: true, 
      mensaje: 'Platillo eliminado de BD correctamente' 
    });
  });
});

// LINEA HASTA EL FINAL 
app.use(express.static(path.join(__dirname)));

//EDITAR PLATILLO
app.post("/platillos/editar", upload.single("imagen"), (req, res) => {
  const { id, nombre, precio, descripcion, categoria } = req.body;
  const nuevaImagen = req.file ? req.file.filename : null;

  if (!id || !nombre || !precio || !descripcion || !categoria) {
    return res.json({ 
      ok: false, 
      mensaje: "Faltan datos para actualizar." 
    });
  }

  let sql = `
    UPDATE PLATILLOS 
    SET Nombre = ?, PRECIO = ?, DESCRIPCION = ?, CATEGORIA = ?
  `;
  let params = [nombre, precio, descripcion, categoria];

  if (nuevaImagen) {
    sql += `, IMAGEN = ? `;
    params.push(nuevaImagen);
  }

  sql += ` WHERE ID_PLATILLO = ?`;
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) {
      console.error("❌ Error al actualizar:", err);
      return res.json({ 
        ok: false, 
        mensaje: "Error al actualizar platillo." 
      });
    }

    res.json({ 
      ok: true, 
      mensaje: "Platillo actualizado correctamente" 
    });
  });
});

// OBTENER PLATILLOS
app.get('/platillos', (req, res) => {

  const sql = `
    SELECT 
      p.*,
      COALESCE(AVG(r.CALIFICACION), 0) AS promedio,
      COUNT(r.ID_RESEÑA) AS totalReseñas
    FROM PLATILLOS p
    LEFT JOIN RESEÑAS r ON r.ID_PLATILLO = p.ID_PLATILLO
    GROUP BY p.ID_PLATILLO
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error en la base de datos"
      });
    }

    res.json(results);
  });

});































//---------------------SECCION RESEÑAS-------------------------
// AGREGA RESEÑAS USANDO EL TOKEN DE SESION
app.post("/resenas", (req, res) => {
  const token = req.cookies.token_sesion;
  const { ID_PLATILLO, CALIFICACION, COMENTARIOS } = req.body;

  if (!ID_PLATILLO || !CALIFICACION || !COMENTARIOS) {
    return res.json({ 
      ok: false, 
      mensaje: "Datos de reseña incompletos" 
    });
  }

  const calificacionNum = Number(CALIFICACION);
  if (calificacionNum < 1 || calificacionNum > 5) {
    return res.json({ 
      ok: false, 
      mensaje: "Calificación inválida" 
    });
  }

  // ❌ Invitados NO pueden reseñar
  if (!token) {
    return res.json({
      ok: false,
      mensaje: "Solo usuarios registrados pueden agregar reseñas"
    });
  }

  // 🔥 BUSCAR ID_CUENTA usando el token
  const userQuery = "SELECT ID_CUENTA FROM CUENTAS WHERE token_sesion = ?";

  db.query(userQuery, [token], (err, data) => {
    if (err || data.length === 0) {
      return res.json({
        ok: false,
        mensaje: "Sesión inválida, vuelve a iniciar sesión"
      });
    }

    const userId = data[0].ID_CUENTA;

    // 🔥 Insertar reseña con el ID correcto
    const sql = `
      INSERT INTO RESEÑAS 
      (ID_PLATILLO, ID_CUENTA, CALIFICACION, COMENTARIOS)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [ID_PLATILLO, userId, calificacionNum, COMENTARIOS], (err2) => {
      if (err2) {
        console.log("ERR SQL:", err2);
        return res.json({ ok: false, mensaje: "Error al guardar reseña (SQL)" });
      }
      res.json({ ok: true, mensaje: "Reseña agregada correctamente" });
    });
  });
});


// ---------------- OBTENER RESEÑAS ----------------
// ---------------- OBTENER RESEÑAS ----------------
app.get("/resenas/:idPlatillo", (req, res) => {
  const id = req.params.idPlatillo;

  const sql = `
    SELECT 
      r.CALIFICACION,
      r.COMENTARIOS,
      r.FECHA,
      COALESCE(c.NOMBRE, 'Anónimo') AS usuario
    FROM RESEÑAS r
    LEFT JOIN CUENTAS c ON r.ID_CUENTA = c.ID_CUENTA
    WHERE r.ID_PLATILLO = ?
    ORDER BY r.FECHA DESC
  `;

  db.query(sql, [id], (err, data) => {
    if (err) return res.json({ ok: false, mensaje: "Error al obtener reseñas" });

    // Calcular total de reseñas
    const total = data.length;

    // Calcular promedio de calificaciones
    const promedio =
      total > 0
        ? data.reduce((sum, r) => sum + r.CALIFICACION, 0) / total
        : 0;

    res.json({
      ok: true,
      reseñas: data,
      total,
      promedio: Number(promedio.toFixed(1)) // redondeado
    });
  });
});






























// -- MOSTRAR USUARIOS --
// Obtener todos los usuarios (solo para administrador)
app.get('/admin/getUsuarios', (req, res) => {
   console.log("📥 Se llamó a /admin/getUsuarios");  // <--- AGREGA ESTO

  // const sql = "SELECT ID_CUENTA AS ID, NOMBRE, EMAIL, IMAGEN, ROL FROM CUENTAS";
  const sql = "SELECT ID_CUENTA AS ID, NOMBRE, EMAIL, IMAGEN, ROL, ACTIVO FROM CUENTAS";


  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener usuarios:", err);
      return res.json({ ok: false });
    }

    return res.json({
      ok: true,
      usuarios: rows
    });
  });
});

// -- ELIMINAR USUARIO (solo administrador) ESTA SE VA A IRRR--
app.post('/admin/eliminarUsuario', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ ok: false, mensaje: "ID no proporcionado" });
  }

  const sql = "DELETE FROM CUENTAS WHERE ID_CUENTA = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error eliminando usuario:", err);
      return res.json({ ok: false, mensaje: "Error eliminando usuario ((;" });
    }

    if (result.affectedRows === 0) {
      return res.json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    return res.json({ ok: true });
  });
});

// -- HABILITAR / DESHABILITAR USUARIO --
app.post('/admin/toggleUsuario', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ ok: false, mensaje: "ID no proporcionado" });
  }

  // Obtener estado actual
  const getSql = "SELECT ACTIVO FROM CUENTAS WHERE ID_CUENTA = ?";

  db.query(getSql, [id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const nuevoEstado = rows[0].ACTIVO ? 0 : 1;

    // Cambiar el estado
    const updateSql = "UPDATE CUENTAS SET ACTIVO = ? WHERE ID_CUENTA = ?";

    db.query(updateSql, [nuevoEstado, id], (err2) => {
      if (err2) {
        console.error("❌ Error al cambiar estado del usuario:", err2);
        return res.json({ ok: false, mensaje: "Error al cambiar estado" });
      }

      return res.json({
        ok: true,
        nuevoEstado
      });
    });
  });
});



app.get("/obtenerpedidos1", (req, res) => {
  const idCuenta = req.cookies.id_cuenta;

  // Si no existe cookie = no hay sesión válida
  if (!idCuenta) {
    return res.status(401).json({
      ok: false,
      mensaje: "No hay sesión activa o falta id_cuenta."
    });
  }

  console.log("🟦 Solicitando pedidos para ID_CUENTA =", idCuenta);

  db.query(
  `SELECT 
      p.ID_PEDIDO,
      p.ID_CUENTA,
      p.FECHA_COMPRA,
      p.TOTAL,
      p.ESTADO,
      d.CANTIDAD,
      pl.NOMBRE AS NOMBRE_PLATILLO,
      pl.PRECIO AS PRECIO_UNITARIO       -- 🔥 AÑADIDO
   FROM PEDIDOS p
   JOIN PEDIDO_DETALLE d ON d.ID_PEDIDO = p.ID_PEDIDO
   JOIN PLATILLOS pl ON pl.ID_PLATILLO = d.ID_PLATILLO
   WHERE p.ID_CUENTA = ?
   ORDER BY p.ID_PEDIDO DESC`,
  [idCuenta],
  (err, rows) => {
    if (err) {
      console.error("Error al obtener pedidos:", err);
      return res.status(500).json({ error: "Error obteniendo pedidos" });
    }

    console.log("🟩 Pedidos encontrados:", rows.length);
    res.json(rows);
  }
);

});



app.post('/eliminarpedido', (req, res) => {
  const { id } = req.body;

  db.query(
    "DELETE FROM pedidos WHERE ID_PEDIDO = ?",
    [id],
    (err, result) => {
      if (err) {
        console.log("Error eliminando pedido:", err);
        return res.status(500).json({ ok: false, mensaje: "Error al eliminar" });
      }

      res.json({ ok: true, mensaje: "Pedido eliminado" });
    }
  );
});


app.get('/vendedor/getPedidos', (req, res) => {
  const query = `
    SELECT 
      p.ID_PEDIDO,
      p.ID_CUENTA,
      c.NOMBRE AS NOMBRE_CLIENTE,
      p.FECHA_COMPRA,
      p.ESTADO,
      d.ID_DETALLE,
      d.ID_PLATILLO,
      d.CANTIDAD,
      (d.CANTIDAD * d.PRECIO_UNITARIO) AS SUBTOTAL,
      pl.NOMBRE AS NOMBRE_PLATILLO
    FROM PEDIDOS p
    JOIN PEDIDO_DETALLE d ON p.ID_PEDIDO = d.ID_PEDIDO
    JOIN PLATILLOS pl ON pl.ID_PLATILLO = d.ID_PLATILLO
    JOIN CUENTAS c ON c.ID_CUENTA = p.ID_CUENTA
    ORDER BY p.ID_PEDIDO DESC, d.ID_DETALLE ASC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error('Error obteniendo pedidos vendedor:', err);
      return res.status(500).json({ ok: false });
    }

    const pedidosMap = {};

    rows.forEach(r => {
      if (!pedidosMap[r.ID_PEDIDO]) {
        pedidosMap[r.ID_PEDIDO] = {
          ID_PEDIDO: r.ID_PEDIDO,
          ID_CUENTA: r.ID_CUENTA,
          NOMBRE_CLIENTE: r.NOMBRE_CLIENTE,
          FECHA_COMPRA: r.FECHA_COMPRA,
          ESTADO: r.ESTADO,
          platillos: []
        };
      }

      pedidosMap[r.ID_PEDIDO].platillos.push({
        ID_PLATILLO: r.ID_PLATILLO,
        NOMBRE_PLATILLO: r.NOMBRE_PLATILLO,
        CANTIDAD: r.CANTIDAD,
        SUBTOTAL: r.SUBTOTAL
      });
    });

    res.json({ ok: true, pedidos: Object.values(pedidosMap) });
  });
});

// Actualizar estado de un pedido
app.post('/vendedor/actualizarestado', (req, res) => {
  const { id, estado } = req.body;

  if (!id || !estado) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos' });
  }

  db.query(
    'UPDATE PEDIDOS SET ESTADO = ? WHERE ID_PEDIDO = ?',
    [estado, id],
    (err, result) => {
      if (err) {
        console.error("Error actualizando estado:", err);
        return res.status(500).json({ ok: false, mensaje: 'Error al actualizar estado' });
      }

      res.json({ ok: true, mensaje: 'Estado actualizado' });
    }
  );
});

// GUARDAR PEDIDO EN BD
app.post("/pedidosbd", (req, res) => {
  const { items } = req.body;

  // 🟢 Obtener ID_CUENTA desde cookie
  const ID_CUENTA = req.cookies.id_cuenta;

  if (!ID_CUENTA) {
    return res.status(401).json({
      ok: false,
      mensaje: "No es posible identificar la sesión del usuario"
    });
  }

  if (!items || !items.length) {
    return res.status(400).json({ ok: false, mensaje: "Sin items" });
  }

  const total = items.reduce((s, it) => s + (it.qty * it.price), 0);

  // Insertar pedido principal
  db.query(
    "INSERT INTO PEDIDOS (ID_CUENTA, FECHA_COMPRA, TOTAL, ESTADO) VALUES (?, NOW(), ?, 'prep')",
    [ID_CUENTA, total],
    (err, result) => {
      if (err) {
        console.error("Error insertando pedido:", err);
        return res.status(500).json({
          ok: false,
          mensaje: "Error al guardar pedido"
        });
      }

      const idPedido = result.insertId;

      // Insertar detalles
      const values = items.map(i => [
        idPedido,
        i.id,
        i.qty,
        i.price
      ]);

      db.query(
        "INSERT INTO PEDIDO_DETALLE (ID_PEDIDO, ID_PLATILLO, CANTIDAD, PRECIO_UNITARIO) VALUES ?",
        [values],
        (err2) => {
          if (err2) {
            console.error("Error insertando detalles:", err2);
            return res.status(500).json({
              ok: false,
              mensaje: "Error en detalles"
            });
          }

          res.json({
            ok: true,
            mensaje: "Pedido guardado",
            idPedido
          });
        }
      );
    }
  );
});

//PARA EL ADMIN
app.get("/obtenerpedidos_admin", (req, res) => {
  db.query(
    `SELECT 
        p.ID_PEDIDO,
        p.ID_CUENTA,
        p.FECHA_COMPRA,
        p.TOTAL,
        p.ESTADO
     FROM PEDIDOS p
     ORDER BY p.ID_PEDIDO DESC`,
    (err, rows) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Error obteniendo pedidos" });
      }
      res.json(rows);
    }
  );
});

// ACTIVAR / DESACTIVAR PLATILLO
// ACTIVAR / DESACTIVAR PLATILLO
app.post('/platillos/toggle', (req, res) => {
  const { id } = req.body;

  const sql = `
    UPDATE PLATILLOS 
    SET ACTIVO = CASE WHEN ACTIVO = 1 THEN 0 ELSE 1 END
    WHERE ID_PLATILLO = ?
  `;

  db.query(sql, [id], (err, result) => {   // ← Aquí se cambió conn por db
    if (err) {
      console.error("❌ Error actualizando ACTIVO:", err);
      return res.json({ ok: false, mensaje: "Error en BD" });
    }

    res.json({ ok: true });
  });
});


















//Script.js

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
    const response = await fetch(`${API_URL}/login`, {
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
        const bw = await fetch(`${API_URL}/bienvenido`);
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
    const respuesta = await fetch(`${API_URL}/crearCuenta`, {
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
    await fetch(`${API_URL}/logout`);
  } catch (err) {
    console.warn('Error al llamar /logout', err);
  }

  state.cart = [];
  storage.set('cart', []); // si usas localStorage para el carrito


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
function renderMenu() {
  const wrap = $('#menuGrid');
  wrap.innerHTML = '';

  let menu = storage.get('menu', []);

  // FILTRAR SOLO PLATILLOS ACTIVOS DESCOMENTAR PARA VER LOS PLATILLOS
   menu = menu.filter(m => m.activo);  // <-- aquí

// Normalizar valores para evitar undefined
   menu = menu.map(m => ({
   ...m,
   promedio: m.promedio ?? 0,
   totalReseñas: m.totalReseñas ?? 0
}));



  // Normalizar valores para evitar undefined
    menu = menu.map(m => ({
   ...m,
  promedio: m.promedio ?? 0,
  totalReseñas: m.totalReseñas ?? 0
  }));

  
  
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





    // DESCOMENTAR const avgRating = m.reviews.length ? (m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length) : 0;
    
    const reviews = Array.isArray(m.reviews) ? m.reviews : [];
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

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
        
        <div>⭐ ${m.promedio} (${m.totalReseñas})</div>

        
        <div class="row" style="justify-content:space-between;margin-top:8px">
          
          <div class="price">${fmt(m.price)}</div>
          
          ${(state.role === "Cliente")
            ? `<button class="btn" ${!m.available ? 'disabled' : ''} data-add="${m.id}">Añadir</button>`
            : ""
          }

          
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
function renderCart() {

  const list = $('#cartList');
  const btn = $('#checkoutBtn'); // 🔥 TU BOTÓN

  if (!state.cart.length) { 
    list.textContent = 'Tu carrito está vacío'; 
    $('#cartTotal').textContent = fmt(0);

    // 🔥 OCULTAR BOTÓN
    if (btn) btn.style.display = "none";

    return; 
  }

  // 🔥 MOSTRAR EL BOTÓN SI HAY PRODUCTOS
  if (btn) btn.style.display = "block";

  list.innerHTML = '';

  state.cart.forEach(ci => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.margin = '6px 0';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <span>${ci.name}</span>
      <div>
        <button onclick="changeQty(${ci.id}, -1)" style="padding:2px 6px">-</button>
        <span id="qty-${ci.id}" style="margin:0 6px">${ci.qty}</span>
        <button onclick="changeQty(${ci.id}, 1)" style="padding:2px 6px">+</button>
      </div>
      <strong>${fmt(ci.qty * ci.price)}</strong>
    `;

    list.appendChild(row);
  });

  const total = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  $('#cartTotal').textContent = fmt(total);
}




// Función para cambiar la cantidad de un ítem
function changeQty(itemId, delta) {
  const item = state.cart.find(i => i.id === itemId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.id !== itemId);
  }

  renderCart();
}

//realiza el checkout y guarda el pedido
function checkout() {
  if (!state.cart.length) return alert('Carrito vacío');

  // Si hay sesión en servidor (cookie), preferible enviar pedido al backend
  // Pero aquí mantendremos tu comportamiento local (storage) y además intentamos POST a /pedido
  const items = state.cart.map(i => ({ id: i.id, qty: i.qty, price: i.price }));
  (async () => {
    try {
      const res = await fetch(`${API_URL}/pedidosbd`, {
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




// PEDIDOS POR CLIENTE EN BD 
// CONFIRMAR PEDIDO



// ===============================




























// ----------------- PEDIDOS CLIENTE -----------------
async function renderClientOrders() {
  try {
    const res = await fetch(`${API_URL}/obtenerpedidos1`, {
      credentials: "include"
    });

    if (res.status === 401) {
      console.warn("⚠ No hay sesión, no se mostrarán pedidos.");
      limpiarPedidos();
      return;
    }

    const orders = await res.json();
    console.log("Datos crudos:", orders);

    // === AGRUPAR POR ID_PEDIDO ===
    const pedidos = {};
    orders.forEach(o => {
      if (!pedidos[o.ID_PEDIDO]) {
        pedidos[o.ID_PEDIDO] = {
          id: o.ID_PEDIDO,
          estado: o.ESTADO,
          total: o.TOTAL,
          items: []
        };
      }
      pedidos[o.ID_PEDIDO].items.push({
        nombre: o.NOMBRE_PLATILLO,
        cantidad: o.CANTIDAD,
        precio: Number(o.PRECIO_UNITARIO)
      });
    });

    const pedidosArray = Object.values(pedidos);

    // Guardar en localStorage para admin
    storage.set('orders', pedidosArray);

    pedidosArray.forEach((p, i) => (p.numero = i + 1));

    const aside = document.querySelector('.aside .p');
    if (!aside) return;

    // Borrar sección antes de renderizar
    const existing = document.getElementById('clientOrders');
    if (existing) existing.remove();

    // === SEPARAR PEDIDOS ===
    const activos = pedidosArray.filter(p => p.estado !== "done");
    const historial = pedidosArray.filter(p => p.estado === "done");

    // === CONTENEDOR ===
    const cont = document.createElement("div");
    cont.id = "clientOrders";
    cont.style.marginTop = "12px";

    cont.innerHTML = `
      <div class="tabs" style="display:flex; gap:12px; margin-bottom:14px;">
        <button id="tabActivos" class="tabBtn active">Mis pedidos</button>
        <button id="tabHistorial" class="tabBtn">Historial</button>
      </div>

      <div id="vistaActivos">
        <h3>Mis pedidos</h3>
        ${
          activos.length
            ? activos.map(p => cardPedido(p)).join("")
            : '<div class="muted">No tienes pedidos en curso.</div>'
        }
      </div>

      <div id="vistaHistorial" style="display:none;">
        <h3>Historial</h3>
        ${
          historial.length
            ? historial.map(p => cardPedido(p)).join("")
            : '<div class="muted">Aún no tienes pedidos en historial.</div>'
        }
      </div>
    `;

    aside.appendChild(cont);

    // === EVENTOS DE PESTAÑAS ===
    document.getElementById("tabActivos").onclick = () => {
      mostrarVista("activos");
    };
    document.getElementById("tabHistorial").onclick = () => {
      mostrarVista("historial");
    };

  } catch (err) {
    console.error("Error mostrando pedidos:", err);
  }
}

// === FUNCIONES DE UI ===
function mostrarVista(tipo) {
  const activos = document.getElementById("vistaActivos");
  const historial = document.getElementById("vistaHistorial");

  const tA = document.getElementById("tabActivos");
  const tH = document.getElementById("tabHistorial");

  if (tipo === "activos") {
    activos.style.display = "block";
    historial.style.display = "none";
    tA.classList.add("active");
    tH.classList.remove("active");
  } else {
    activos.style.display = "none";
    historial.style.display = "block";
    tA.classList.remove("active");
    tH.classList.add("active");
  }
}

// === COMPONENTE CARD ===
function cardPedido(p) {
  return `
    <div class="card pe" style="margin:8px 0">
      <strong>Pedido #${p.numero}</strong>
      <span class="status ${p.estado}">
        ${estadoTexto(p.estado)}
      </span>

      <ul>
        ${p.items.map(i => `
          <li>
            ${i.nombre} × ${i.cantidad} — ${fmt(i.precio * i.cantidad)}
          </li>
        `).join("")}
      </ul>

      <div style="margin-top:6px">
        <strong>Total:</strong> ${fmt(p.total)}
      </div>
    </div>
  `;
}



// 🔥 Función auxiliar para borrar pedidos si no hay sesión
function limpiarPedidos() {
  const existing = document.getElementById("clientOrders");
  if (existing) existing.remove();
}








async function deletePedido(id) {
  if (!confirm("¿Eliminar este pedido?")) return;

  try {
    const res = await fetch(`${API_URL}/eliminarpedido`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await res.json();

    if (data.ok) {
      alert("Pedido eliminado");
      renderClientOrders();
    } else {
      alert("Error al eliminar");
    }
  } catch (err) {
    console.error("Error eliminando pedido:", err);
  }
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
    const res = await fetch(`${API_URL}/resenas/${prod.id}`);
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
    // 🔥 Guardar promedio y total en el producto y actualizar menú
    prod.promedio = data.promedio ?? 0;
    prod.totalReseñas = data.total ?? 0;

    // Actualizar menú en localStorage
    storage.set('menu', menu);

    // Refrescar menú en pantalla
    renderMenu();  

  } catch (e) {
    console.error(e);
    $('#reviewList').innerHTML = '<div class="muted">Error al cargar reseñas</div>';
  }


  // Bloquear reseñas para invitados
  if (state.role === 'Invitado') {
    $('#reviewInput').style.display = "none";
    $('#reviewRating').style.display = "none";
    $('#sendReviewBtn').style.display = "none";
  } else {
    $('#reviewInput').style.display = "block";
    $('#reviewRating').style.display = "block";
    $('#sendReviewBtn').style.display = "block";
  }

  $('#reviewInput').value = '';
  $('#reviewRating').value = '5';
  $('#reviewModal').style.display = 'grid';
}
//Boton para enviar reseña
$('#sendReviewBtn').onclick = async () => {
  if (state.role === 'Invitado') {
    return alert("❌ Debes iniciar sesión para dejar una reseña.");
  }

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
    const res = await fetch(`${API_URL}/resenas`, {
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

   
    renderMenu();
    openReviewModal();
    

  } catch (e) {
    alert("Error al enviar reseña al servidor");
    console.error(e);
  }
};
$('#closeReviewBtn').onclick = () => $('#reviewModal').style.display = 'none';






























// ----------------- PEDIDOS VENDEDOR ----------------
//renderiza pedidos para el vendedor

function estadoTexto(st) {
  return st === 'prep' ? 'En preparación' : st === 'ready' ? 'Listo' : st === 'done' ? 'Entregado' : st;
}


// Renderizar pedidos del vendedor agrupados y numerados por cliente
async function renderOrdersSeller() {
  const wrap = document.getElementById('ordersGrid');
  wrap.innerHTML = '';

  try {
    const res = await fetch(`${API_URL}/vendedor/getPedidos`);
    const data = await res.json();

    if (!data.ok) {
      wrap.innerHTML = '<div class="muted">Error cargando pedidos.</div>';
      return;
    }

    const orders = data.pedidos;

    if (!orders.length) {
      wrap.innerHTML = '<div class="muted">No hay ordenes.</div>';
      return;
    }

    // ----------------------------------------------------------------
    // AGRUPAR POR CLIENTE
    // ----------------------------------------------------------------
    const grupos = {}; // { ID_CUENTA: { clienteNombre, pedidos:[] } }

    orders.forEach(o => {
      if (!grupos[o.ID_CUENTA]) {
        grupos[o.ID_CUENTA] = {
          cliente: o.NOMBRE_CLIENTE,
          pedidos: []
        };
      }
      grupos[o.ID_CUENTA].pedidos.push(o);
    });

    // ----------------------------------------------------------------
    // RENDERIZAR AGRUPADO Y NUMERADO
    // ----------------------------------------------------------------
    Object.values(grupos).forEach(grupo => {
      // Título de cliente
      const title = document.createElement('h3');
      title.textContent = `Ordenes de : ${grupo.cliente}`;
      wrap.appendChild(title);

      // Contador de pedidos por cliente
      let counter = 1;

      grupo.pedidos.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card p';

        let lista = '';
        o.platillos.forEach(p => {
          lista += `<li>${p.NOMBRE_PLATILLO} × ${p.CANTIDAD}</li>`;
        });

        card.innerHTML = `
  <div class="pedido-header">
    <div>
      <strong class="pedido-num">Orden ${counter}</strong>
      <span class="pedido-id">#ID BD${o.ID_PEDIDO}</span>
    </div>
    <span class="status ${o.ESTADO}">${estadoTexto(o.ESTADO)}</span>
  </div>

  <ul class="pedido-lista">
    ${lista}
  </ul>

  <div class="semaforo" data-id="${o.ID_PEDIDO}" data-estado="${o.ESTADO}">

  <div class="semaforo-item">
    <div class="light prep ${o.ESTADO === 'prep' ? 'on' : ''}"></div>
    <span>En preparación</span>
  </div>

  <div class="semaforo-item">
    <div class="light ready ${o.ESTADO === 'ready' ? 'on' : ''}"></div>
    <span>Listo</span>
  </div>

  <div class="semaforo-item">
    <div class="light done ${o.ESTADO === 'done' ? 'on' : ''}"></div>
    <span>Entregado</span>
  </div>

</div>


`;


        wrap.appendChild(card);
        counter++;
      });

      wrap.appendChild(document.createElement('hr'));
    });

  } catch (err) {
    console.error('Error cargando pedidos:', err);
    wrap.innerHTML = '<div class="muted">Error cargando pedidos.</div>';
  }

  // Manejar avance de estado
  wrap.onclick = async (e) => {
  const light = e.target.closest('.light');
  if (!light) return;

  const sem = light.closest('.semaforo');
  const id = sem.dataset.id;

  // Estado según el color clickeado
  let nuevoEstado = 'prep';
  if (light.classList.contains('ready')) nuevoEstado = 'ready';
  if (light.classList.contains('done')) nuevoEstado = 'done';

  try {
    const res = await fetch(`${API_URL}/vendedor/actualizarestado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: nuevoEstado })
    });

    const data = await res.json();

    if (!data.ok) {
      alert('Error al actualizar estado');
      return;
    }

    // Recargar pedidos con nuevo estado
    renderOrdersSeller();

  } catch (err) {
    console.error('Error actualizando estado:', err);
  }
};

}




























// ----------------- ADMIN -----------------
//seccion Administrador
//agregar y eliminar platillos
async function renderAdminKpis() {
  try {
    const res = await fetch(`${API_URL}/obtenerpedidos_admin`);
    const orders = await res.json();

    const menu = storage.get('menu', []);

    // TOTAL DE VENTAS (solo pedidos completados)
    const ventas = orders
      .filter(o => o.ESTADO === 'done')
      .reduce((s, o) => s + Number(o.TOTAL), 0);

    // TICKET PROMEDIO
    const ticket = orders.length
      ? ventas / orders.length
      : 0;

    // PINTAR KPI EN EL FRONT
    $('#kpiVentas').textContent = fmt(ventas);
    $('#kpiPedidos').textContent = orders.length;
    $('#kpiTicket').textContent = fmt(ticket);
    $('#kpiMenu').textContent = menu.length;
    
  } catch (err) {
    console.error("Error obteniendo KPIs admin:", err);
  }
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

  const res = await fetch(`${API_URL}/platillos`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  console.log("Respuesta backend:", data);

  alert(data.message);

// 🔥 volver a cargar platillos DESDE MYSQL
await cargarPlatillos();

// 🔥 volver a renderizar el menú, filtros y admin
renderAll();

// limpiar formulario
$('#newName').value = "";
$('#newPrice').value = "";
$('#newDesc').value = "";
$('#newCategory').value = "";
$('#newImg').value = "";

};


async function handleTogglePlatillo(e) {
  const btn = e.target.closest('[data-toggle-platillo]');
  if (!btn) return;

  const id = btn.getAttribute('data-toggle-platillo');

  const res = await fetch(`${API_URL}/platillos/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const data = await res.json();
  if (!data.ok) {
    alert("Error actualizando estado del platillo");
    return;
  }

  await cargarPlatillos(); // recargar lista
  renderAll(); // refrescar menú/admin
}








// Renderiza lista de platillos con opción a eliminar
function renderAdminMenuList() {
  const menu = storage.get('menu', []);

  const container = $('#adminMenuListContainer');
  if (!container) return;
  container.innerHTML = ''; // limpio
  const panel = document.createElement('div');
  panel.className = 'card p';
  panel.innerHTML = `
    <h3>Administrar platillos</h3>` + (menu.length ? menu.map(m => {
      const estadoTexto = m.activo ? "Activo" : "Inactivo";      // ← CORREGIDO
      const btnEstado = m.activo ? "Deshabilitar" : "Habilitar"; // ← CORREGIDO
      const estadoColor = m.activo ? "green" : "red";            // ← CORREGIDO

      return `
      <div class="row" style="margin:4px 0; align-items:center; justify-content:space-between">
        <span style="flex:1">${m.name} (${fmt(m.price)})</span>

        <p style="color:${estadoColor}; font-weight:bold; margin:0 8px;">
          ${estadoTexto}
        </p>

        <button class="btn brand" data-edit="${m.id}">Editar</button>

        <!-- <button class="btn ghost" data-del="${m.id}">Eliminar</button> -->

        <button class="btn toggle" data-toggle-id="${m.id}">${btnEstado}</button>
      </div>`;
    }).join('') : '<div class="muted">No hay platillos en el menú.</div>');

  container.appendChild(panel);

  // Delegación de eventos
  panel.onclick = async (e) => {

    // BOTÓN ELIMINAR
    const delId = e.target.dataset.del;
    if (delId) {
      if (!confirm('¿Eliminar este platillo?')) return;
      try {
        const res = await fetch(`${API_URL}/platillos/eliminar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: delId })
        });
        const data = await res.json();
        if (!data.ok) return alert('Error: ' + data.mensaje);

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
      return;
    }

    // BOTÓN EDITAR
    const editId = e.target.dataset.edit;
    if (editId) {
      openEditDishModal(editId);
      return;
    }

    // BOTÓN TOGGLE
    const toggleId = e.target.dataset.toggleId;
    if (toggleId) {
      try {
        const res = await fetch(`${API_URL}/platillos/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: toggleId })
        });
        const data = await res.json();
        if (!data.ok) return alert('Error: ' + data.mensaje);

        // recargar menú y admin
        await cargarPlatillos();      // asegura que storage tenga el valor actualizado
        renderAdminMenuList();        // renderiza el panel admin con el nuevo estado
        renderAll();                  // renderiza menú y filtros visibles para front
      } catch (err) {
        console.error(err);
      }
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

  const res = await fetch(`${API_URL}/platillos/editar`, {
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
    const res = await fetch(`${API_URL}/platillos`);
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
        reviews: [],
        activo: p.ACTIVO === 1 // <-- ✅ agregar ACTIVO aquí
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


async function handleDelete(e) {
  if (!e.target.classList.contains('btn-eliminar')) return;

  const id = e.target.dataset.id;
  if (!confirm("¿Eliminar este usuario?")) return;

  try {
    const res = await fetch(`${API_URL}/admin/eliminarUsuario`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (!data.ok) return alert("Error eliminando usuario");

    await cargarUsuariosAdmin(); // Refrescar lista
    alert("Usuario eliminado");
  } catch (err) {
    console.error(err);
  }
}

async function handleToggle(e) {
  const btn = e.target.closest('[data-toggle-id]');
  if (!btn) return;

  const id = btn.getAttribute('data-toggle-id');

  const res = await fetch(`${API_URL}/admin/toggleUsusario`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const data = await res.json();

  if (!data.ok) {
    alert("Error: " + data.mensaje);
    return;
  }

  // Recargar la lista para ver cambios
  cargarUsuariosAdmin();
}


async function cargarUsuariosAdmin() {

  try {
    const res = await fetch(`${API_URL}/admin/getUsuarios`);
    const data = await res.json();

    if (!data.ok) {
      console.error("No se pudieron cargar los usuarios");
      return;
    }

    const grid = document.getElementById('usuariosGrid');
    grid.innerHTML = "";

    data.usuarios.forEach(u => {
      const avatar = "/imagenes_Perfiles/Tacos.jpg";

      const estadoTexto = u.ACTIVO ? "Activo" : "Inactivo";
      const estadoColor = u.ACTIVO ? "green" : "red";
      const btnEstado = u.ACTIVO ? "Deshabilitar" : "Habilitar";

      grid.innerHTML += `
        <div class="usuario-card">
            <img class="avatar" src="${avatar}">
            
            <div class="usuario-info">
                <h4>${u.NOMBRE}</h4>
                <p>${u.EMAIL}</p>
                <p><strong>${u.ROL || "Cliente"}</strong></p>

                <!-- Estado visual -->
                <p style="color:${estadoColor}; font-weight:bold;">
                  ${estadoTexto}
                </p>
            </div>

            <!-- Botón activar/desactivar -->
            <button class="btn-toggle"
                    data-toggle-id="${u.ID}">
              ${btnEstado}
            </button>

            <!-- Botón eliminar 
            <button class="btn-eliminar" data-id="${u.ID}">
              Eliminar
            </button> -->
        </div>
      `;
    });

    // Limpia listeners duplicados
    grid.removeEventListener('click', handleDelete); 
    grid.removeEventListener('click', handleToggle);  

    // Listener eliminar
    grid.addEventListener('click', handleDelete);

    // Listener activar/desactivar
    grid.addEventListener('click', handleToggle);

  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
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
  cargarUsuariosAdmin(); // COMENTAR
  renderClientOrders();
}










// ---------- Inicialización ---------- 
window.onload = async () => {
  await cargarPlatillos(); // Trae los platillos desde el backend
  initAvatarSelector();
  // Verificar si hay sesión REAL en el servidor
  const bw = await fetch(`${API_URL}/bienvenido`);
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
