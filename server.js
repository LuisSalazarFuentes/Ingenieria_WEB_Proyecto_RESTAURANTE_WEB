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
  password: '123456789',
  database: 'DeTodoUnPoco'
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

  // Validar formato de correo y contraseña
  const errores = validarCredenciales(usuario, password);
  if (errores.length > 0) {
    return res.json({
      ok: false,
      mensaje: errores.join('\n')
    });
  }

  // ÚNICA TABLA: USUARIOS
  const queryUser = 'SELECT * FROM CUENTAS WHERE EMAIL = ?';

  db.query(queryUser, [usuario], (err, results) => {
    if (err) {
      console.error('❌ Error al consultar CUENTAS:', err);
      return res.json({
        ok: false,
        mensaje: 'Error interno del servidor.'
      });
    }

    // Si no existe el usuario
    if (results.length === 0) {
      return res.json({
        ok: false,
        mensaje: '❌ Usuario no encontrado.'
      });
    }

    const user = results[0];

    // Validar contraseña
    if (user.PASSWORD !== password) {
      return res.json({ 
        ok: false, 
        mensaje: '❌ Contraseña incorrecta.' 
      });
    }

    // Generar token único
    const token = uuidv4();

    // Guardar token en la tabla USUARIOS
    const sqlUpdate = 'UPDATE CUENTAS SET token_sesion = ? WHERE EMAIL = ?';
    db.query(sqlUpdate, [token, usuario], (err2) => {
      if (err2) {
        console.error('❌ Error al guardar token CUENTA:', err2);
        return res.json({ 
          ok: false, 
          mensaje: 'Error al guardar sesión.' 
        });
      }

      // Guardar cookie en el navegador
      res.cookie('token_sesion', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10  // 10 minutos
      });

      // Enviar mensaje con Rol real desde la BD
      return res.json({
        ok: true,
        mensaje: `✅ Bienvenido, ${user.NOMBRE}!`,
        rol: user.ROL  // ← Cliente, Vendedor, Administrador
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
  
  db.query(query, [token, token], (err, results) => {
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
      // Borrar token en CUENTAS
      await db.promise().query(
        'UPDATE CUENTAS SET token_sesion = NULL WHERE token_sesion = ?',
        [token]
      );

      // Quitar cookie del navegador
      res.clearCookie('token_sesion');
      
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  }

  res.redirect('/');
});








































//-----------------------seccion platillo-----------------------

//AGREGAR PLATILLOS BD 
app.post("/platillos", upload.single("imagen"), (req, res) => {

  console.log(">>> LLEGO A /api/platillos");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

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
  db.query('SELECT * FROM PLATILLOS', (err, results) => {
    if (err) { 
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error en la base de datos' 
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

    res.json({ ok: true, reseñas: data });
  });
});































//---------------------SECCION PEDIDOS-------------------------////
// CREAR PEDIDO
app.post('/pedido', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) {
    return res.json({ 
      ok: false, 
      mensaje: 'No hay sesión' 
    });
  }
  const { items } = req.body;
  if (!items || !items.length) {
    return res.json({ 
      ok: false, 
      mensaje: 'Carrito vacío' 
    });
  }

  // Obtener cliente
  db.query('SELECT ID_CUENTA FROM CUENTAS WHERE token_sesion = ?', [token], (err, cliResults) => {
    
    if (err || cliResults.length === 0) {
      return res.json({ 
        ok: false, 
        mensaje: 'Usuario no encontrado' 
      });
    }
    const clienteId = cliResults[0].ID_CUENTA;

    // Crear pedido
    db.query('INSERT INTO PEDIDOS (ID_CUENTA, STATUS, TOTAL) VALUES (?, "prep", ?)', [clienteId, items.reduce((s,i)=>s+i.qty*i.price,0)], (err2, result) => {
      
      if (err2) {
        return res.json({ 
          ok: false, 
          mensaje: 'Error al guardar pedido' 
        });
      }
      const pedidoId = result.insertId;

      // Insertar detalle pedido
      const detalles = items.map(i => [pedidoId, i.id, i.qty, i.price]);
      db.query('INSERT INTO DETALLE_PEDIDO (ID_PEDIDO, ID_PLATILLO, CANTIDAD, PRECIO) VALUES ?', [detalles], err3 => {
        
        if (err3) {
          return res.json({ 
            ok: false, 
            mensaje: 'Error al guardar detalle' 
          });
        }
        return res.json({ 
          ok: true, 
          mensaje: 'Pedido confirmado' 
        });
      });
    });
  });
});










// OBTENER PEDIDOS DEL CLIENTE
app.get('/pedidos', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) {
    return res.json({ 
      ok: false, 
      mensaje: 'No hay sesión' 
    });
  }

  db.query('SELECT ID_CUENTA FROM CUENTAS WHERE token_sesion = ?', [token], (err, cliResults) => {
    
    if (err || cliResults.length === 0) {
      return res.json({ 
        ok: false, 
        mensaje: 'Usuario no encontrado' 
      });
    }
    const clienteId = cliResults[0].ID_CUENTA;

    const query = `
      
      SELECT p.ID_PEDIDO, p.STATUS, p.TOTAL, dp.ID_PLATILLO, dp.CANTIDAD, dp.PRECIO, pl.NOMBRE
      
      FROM PEDIDOS p
      
      JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDO = dp.ID_PEDIDO
      
      JOIN PLATILLOS pl ON dp.ID_PLATILLO = pl.ID_PLATILLO
      
      WHERE p.ID_CUENTA = ?
      
      ORDER BY p.ID_PEDIDO DESC
    `;
    db.query(query, [clienteId], (err2, results) => {
      if (err2) {
        return res.json({ 
          ok: false, 
          mensaje: 'Error al consultar pedidos' 
        });
      }

      const pedidos = [];
      results.forEach(r => {
        let p = pedidos.find(x => x.id === r.ID_PEDIDO);
        if (!p) {
          p = { id: r.ID_PEDIDO, status: r.STATUS, total: r.TOTAL, items: [] };
          pedidos.push(p);
        }
        p.items.push({ id: r.ID_PLATILLO, name: r.NOMBRE, qty: r.CANTIDAD, price: r.PRECIO });
      });
    res.json(pedidos);
    });
  });
});








































app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));
