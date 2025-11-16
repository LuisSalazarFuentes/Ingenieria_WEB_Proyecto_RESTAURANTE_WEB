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

// Conexión MySQL donde cada usuario por separado pueden agrergar su BD para pruebas
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
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

// LOGIN
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.json({ ok: false, mensaje: 'Faltan datos en el formulario.' });

  const queryEmpleado = 'SELECT * FROM EMPLEADOS WHERE EMAIL = ?';
  db.query(queryEmpleado, [usuario], (err, empResults) => {
    if (err) return res.json({ ok: false, mensaje: 'Error interno del servidor.' });

    if (empResults.length === 0) {
      const queryCliente = 'SELECT * FROM CLIENTES WHERE EMAIL = ?';
      db.query(queryCliente, [usuario], (err2, cliResults) => {
        if (err2) return res.json({ ok: false, mensaje: 'Error interno del servidor.' });
        if (cliResults.length === 0) return res.json({ ok: false, mensaje: 'Usuario no encontrado.' });

        const cliente = cliResults[0];
        if (cliente.PASSWORD === password) {
          const token = uuidv4();
          db.query('UPDATE CLIENTES SET token_sesion = ? WHERE EMAIL = ?', [token, usuario], err3 => {
            if (err3) return res.json({ ok: false, mensaje: 'Error al guardar sesión.' });
            res.cookie('token_sesion', token, { httpOnly: true, maxAge: 1000 * 60 * 10 });
            return res.json({ ok: true, mensaje: `Bienvenido, ${cliente.NOMBRE}!`, rol: 'Cliente' });
          });
        } else {
          return res.json({ ok: false, mensaje: 'Contraseña incorrecta.' });
        }
      });
    } else {
      const empleado = empResults[0];
      if (empleado.PASSWORD === password) {
        const token = uuidv4();
        db.query('UPDATE EMPLEADOS SET token_sesion = ? WHERE EMAIL = ?', [token, usuario], err4 => {
          if (err4) return res.json({ ok: false, mensaje: 'Error al guardar sesión.' });
          res.cookie('token_sesion', token, { httpOnly: true, maxAge: 1000 * 60 * 10 });
          return res.json({ ok: true, mensaje: `Bienvenido, ${empleado.NOMBRE}!`, rol: empleado.ROL || 'Empleado' });
        });
      } else {
        return res.json({ ok: false, mensaje: 'Contraseña incorrecta.' });
      }
    }
  });
});

// COMPROBAR SESIÓN
app.get('/bienvenido', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) return res.json({ ok: false, mensaje: 'No hay sesión' });

  const query = 'SELECT NOMBRE, ROL FROM EMPLEADOS WHERE token_sesion = ? UNION SELECT NOMBRE, "Cliente" as ROL FROM CLIENTES WHERE token_sesion = ?';
  db.query(query, [token, token], (err, results) => {
    if (err || results.length === 0) return res.json({ ok: false, mensaje: 'Sesión no válida.' });
    const user = results[0];
    res.json({ ok: true, usuario: user.NOMBRE, rol: user.ROL });
  });
});

// LOGOUT
app.get('/logout', (req, res) => {
  const token = req.cookies.token_sesion;
  if (token) {
    db.query('UPDATE CLIENTES SET token_sesion = NULL WHERE token_sesion = ?', [token]);
    db.query('UPDATE EMPLEADOS SET token_sesion = NULL WHERE token_sesion = ?', [token]);
    res.clearCookie('token_sesion');
  }
  res.redirect('/');
});

// OBTENER PLATILLOS
app.get('/platillos', (req, res) => {
  db.query('SELECT * FROM PLATILLOS', (err, results) => {
    if (err) return res.status(500).json({ ok: false, mensaje: 'Error en la base de datos' });
    res.json(results);
  });
});

// CREAR PEDIDO
app.post('/pedido', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) return res.json({ ok: false, mensaje: 'No hay sesión' });
  const { items } = req.body;
  if (!items || !items.length) return res.json({ ok: false, mensaje: 'Carrito vacío' });

  // Obtener cliente
  db.query('SELECT ID_CLIENTE FROM CLIENTES WHERE token_sesion = ?', [token], (err, cliResults) => {
    if (err || cliResults.length === 0) return res.json({ ok: false, mensaje: 'Usuario no encontrado' });
    const clienteId = cliResults[0].ID_CLIENTE;

    // Crear pedido
    db.query('INSERT INTO PEDIDOS (ID_CLIENTE, STATUS, TOTAL) VALUES (?, "prep", ?)', [clienteId, items.reduce((s,i)=>s+i.qty*i.price,0)], (err2, result) => {
      if (err2) return res.json({ ok: false, mensaje: 'Error al guardar pedido' });
      const pedidoId = result.insertId;

      // Insertar detalle pedido
      const detalles = items.map(i => [pedidoId, i.id, i.qty, i.price]);
      db.query('INSERT INTO DETALLE_PEDIDO (ID_PEDIDO, ID_PLATILLO, CANTIDAD, PRECIO) VALUES ?', [detalles], err3 => {
        if (err3) return res.json({ ok: false, mensaje: 'Error al guardar detalle' });
        return res.json({ ok: true, mensaje: 'Pedido confirmado' });
      });
    });
  });
});

// OBTENER PEDIDOS DEL CLIENTE
app.get('/pedidos', (req, res) => {
  const token = req.cookies.token_sesion;
  if (!token) return res.json({ ok: false, mensaje: 'No hay sesión' });

  db.query('SELECT ID_CLIENTE FROM CLIENTES WHERE token_sesion = ?', [token], (err, cliResults) => {
    if (err || cliResults.length === 0) return res.json({ ok: false, mensaje: 'Usuario no encontrado' });
    const clienteId = cliResults[0].ID_CLIENTE;

    const query = `
      SELECT p.ID_PEDIDO, p.STATUS, p.TOTAL, dp.ID_PLATILLO, dp.CANTIDAD, dp.PRECIO, pl.NOMBRE
      FROM PEDIDOS p
      JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDO = dp.ID_PEDIDO
      JOIN PLATILLOS pl ON dp.ID_PLATILLO = pl.ID_PLATILLO
      WHERE p.ID_CLIENTE = ?
      ORDER BY p.ID_PEDIDO DESC
    `;
    db.query(query, [clienteId], (err2, results) => {
      if (err2) return res.json({ ok: false, mensaje: 'Error al consultar pedidos' });

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
