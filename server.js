console.log("holamundo!");
const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const { JSON } = require("mysql/lib/protocol/constants/types");
const { stringify, parse } = require("querystring");
const ejs = require("ejs");
// Create a connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "defense_db",
});
const app = express();

app.use(cors());

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", "./");

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static("estatic"));

app.get("/", function (request, response) {
  // Renderizamos la plantilla de login
  response.sendFile(path.join(__dirname + "/login.html"));
});
var id = 0;
app.post("/auth", function (request, response) {
  // Capturamos los campos de entrada
  let username = request.body.username;
  let password = request.body.password;

  // Verificamos que los campos no estén vacíos
  if (username && password) {
    // Ejecutamos una consulta SQL para buscar el usuario en la base de datos
    connection.query(
      "SELECT usuarios.id ,usuarios.password , mails.direction FROM usuarios inner JOIN mails ON usuarios.correo = mails.id WHERE mails.direction =? AND usuarios.password =?",
      [username, password],
      function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          // Autenticamos al usuario y creamos una sesión
          id = results[0].id;
          console.log(id);
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect("/dashboard");
          // Redirigimos al usuario a la página de inicio
        } else {
          // Mostramos un mensaje de error si el usuario no existe
          response.send("Incorrect Username and/or Password!");
        }
      }
    );
  } else {
    // Mostramos un mensaje de error si los campos están vacíos
    response.send("Please enter Username and Password!");
  }
});

// Ruta para la página de inicio (requiere autenticación)
app.get("/dashboard", cors(), function (request, response) {
  // Verificamos si el usuario está autenticado
  if (request.session.loggedin) {
    const query =
      "SELECT defendidos.nombre, defendidos.apellido, califiaciones_juridicas.calificacion, causas.fecha_inicio FROM causas INNER JOIN defendidos_causas ON causas.id = defendidos_causas.id_causa INNER JOIN defendidos ON defendidos_causas.id_defendido = defendidos.id INNER JOIN defensores_causas ON causas.id = defensores_causas.id_causa INNER JOIN usuarios ON usuarios.id = defensores_causas.id_defensor INNER JOIN califiaciones_juridicas ON califiaciones_juridicas.id = defendidos_causas.id_calificacion where usuarios.id =? & causas.estado = 1;"; // your query here
    connection.query(query, [id], function (error, results, fields) {
      if (error) throw error;
      if (results.length > 0) {
        console.log('estos son los resultados ',results);
        const casos = {
          nombre: [],    
          apellido: [],    
          cargo: [],    
          apertura: []
        };
        results.forEach((current) => {

          console.log("Current:", current);
    
          casos.nombre.push(current.nombre);
    
          casos.apellido.push(current.apellido);
    
          casos.cargo.push(current.calificacion);
    
          casos.apertura.push(current.fecha_inicio);
    
        });
        // Store the casos array in a variable that can be accessed outside the callback function
        const data = { casos };
        ejs.renderFile("dashboard.html", data, (err, html) => {
          if (err) {
            console.error(err);
            response.status(500).send("Error al renderizar la plantilla");
          } else {
            console.log(data); // should log the casos array
            response.send(html);
          }
        });
      } else {
        response.send("no hay casos asignados");
      }
    });
  } else {
    // Mostramos un mensaje de error si el usuario no está autenticado
    response.send("Please login to view this page!");
  }
});
app.listen(3000, function () {
  console.log("CORS-enabled web server listening on port 3000");
});
