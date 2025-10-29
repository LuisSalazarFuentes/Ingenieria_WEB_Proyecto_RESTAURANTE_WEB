const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

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




//ENTRAR EN LA BASE DE DATOS Y BUSCAR EL USUARIO
// Ruta protegida (requiere sesión)
app.get('/bienvenido', (req, res) => {
  const token = req.cookies.token_sesion;

  if (!token) {
    return res.redirect('/');
  }

  db.query('SELECT usuario FROM usuarios WHERE token_sesion = ?', [token], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ 
        ok: false, 
        mensaje: 'Sesión no válida.' 
      });
    }

    const usuario = results[0].NOMBRE;
    const rol = results[0].ROL || 'cliente';
    res.json({ ok: true, usuario, rol }); 
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

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexMayus = /[A-Z]/;
  const regexMinus = /[a-z]/;
  const regexNumero = /[0-9]/;

  let errores = [];

  // Validar correo y contraseña
  if (!regexCorreo.test(usuario)) errores.push("El usuario debe ser un correo válido.");
  if (!regexMayus.test(password)) errores.push("La contraseña debe tener mínimo 1 mayúscula.");
  if (!regexMinus.test(password)) errores.push("La contraseña debe tener mínimo 1 minúscula.");
  if (!regexNumero.test(password)) errores.push("La contraseña debe tener mínimo 1 número.");
  if (password.length < 8) errores.push(`Faltan ${8 - password.length} caracteres para alcanzar 8.`);

  if (errores.length > 0) {
    return res.json({ 
      ok: false, 
      mensaje: errores.join('\n') 
    });
  }

  // Validación en MySQL
  db.query('SELECT * FROM EMPLEADOS WHERE EMAIL = ?', [usuario], (err, results) => {
    if (err) {
      console.error('Error al consultar MySQL:', err);
      return res.json({ 
        ok: false, 
        mensaje: 'Error interno del servidor.' 
      });
    }

    if (results.length === 0) {
      return res.json({ 
        ok: false, 
        mensaje: '❌ Usuario no encontrado.' 
      });
    }

    const user = results[0];
    if (user.PASSWORD === password) {
      // Generar token y guardar en BD
      const token = uuidv4();
      db.query('UPDATE EMPLEADOS SET token_sesion = ? WHERE EMAIL = ?', [token, usuario], err2 => {
        if (err2) {
          console.error('❌ Error al guardar token:', err2);
          return res.json({ 
            ok: false, 
            mensaje: 'Error al guardar sesión.' 
          });
        }

        // Enviar cookie de sesión
        res.cookie('token_sesion', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 10 // 10 minutos
        });

        res.json({
          ok: true,
          mensaje: `✅ Bienvenido, ${user.NOMBRE || usuario}!`,
          role: user.ROL || 'cliente'
        });
      });
    } else {
      res.json({ 
        ok: false, 
        mensaje: '❌ Contraseña incorrecta.' });
    }
  });
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  const token = req.cookies.token_sesion;
  if (token) {
    db.query('UPDATE usuarios SET token_sesion = NULL WHERE token_sesion = ?', [token]);
    res.clearCookie('token_sesion');
  }
  res.redirect('/');
});






app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));
