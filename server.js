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










// Conexión MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Safl982895544*',
  database: 'detodounpoco'
});

db.connect(err => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err);
    return;
  }
  console.log('✅ Conexión a MySQL exitosa');
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ProyectoRestaurante.html'));
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



// LINEA HASTA EL FINAL 
app.use(express.static(path.join(__dirname)));
app.listen(8080, () => console.log('🚀 Servidor corriendo en http://0.0.0.0:8080'));
