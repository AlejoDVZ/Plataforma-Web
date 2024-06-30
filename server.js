
console.log("holamundo!");
const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors')
// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'defense_db'
});
const app = express();

app.use(cors());

app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})



app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static('estatic'));

app.get('/', function(request, response) {
  // Renderizamos la plantilla de login
  response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
  // Capturamos los campos de entrada
  let username = request.body.username;
  let password = request.body.password;
  // Verificamos que los campos no estén vacíos
  if (username && password) {
    // Ejecutamos una consulta SQL para buscar el usuario en la base de datos
    connection.query('SELECT usuarios.password , mails.direction FROM usuarios inner JOIN mails ON usuarios.correo = mails.id WHERE mails.direction =? AND usuarios.password =?', [username, password], function(error, results, fields) {
      // Si hay un error en la consulta, lo mostramos
      if (error) throw error;
      // Si el usuario existe en la base de datos
      if (results.length > 0) {
        // Autenticamos al usuario y creamos una sesión
        request.session.loggedin = true;
        request.session.username = username;
        // Redirigimos al usuario a la página de inicio
        return response.redirect('/dashboard');
      } else {
        // Mostramos un mensaje de error si el usuario no existe
        response.send('Incorrect Username and/or Password!');
      }
    });
  } else {
    // Mostramos un mensaje de error si los campos están vacíos
    response.send('Please enter Username and Password!');
  }
});

// Ruta para la página de inicio (requiere autenticación)
app.get('/dashboard',cors(), function(request, response) {
  // Verificamos si el usuario está autenticado
  if (request.session.loggedin) {
    // Mostramos un mensaje de bienvenida con el nombre de usuario
    response.sendFile(path.join(__dirname + '/dashboard.html'));
  } else {
    // Mostramos un mensaje de error si el usuario no está autenticado
    response.send('Please login to view this page!');
  }
});
app.listen(3000, function () {
  console.log('CORS-enabled web server listening on port 3000')
})