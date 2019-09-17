var app = require('express')(); // Allows us to serve up http pages easily
var http = require('http').createServer(app); // Creates our http server
var io = require('socket.io')(http); // Creates our socket.io server
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables

// Initialize dotenv
dotenv.config();

// Send the home page when get request made to root directory
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Listen for connection events from clients
io.on('connection', function(socket) {
  // Log to the console that a client has connected
  console.log('A client has connected');

  // Listen for disconnect events from clients
  socket.on('disconnect', function() {
    // Log to the console that a client has disconnected
    console.log('A client has disconnected');
  });
});

// Start our http server on port 8080
http.listen(8080, function() {
  // Log to the console that we are listening
  console.log('listening on *:8080');
});
