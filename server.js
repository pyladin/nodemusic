var app = require('express')(); // Allows us to serve up http pages easily
var http = require('http').createServer(app); // Creates our http server
var io = require('socket.io')(http); // Creates our socket.io server

// Send the home page when get request made to root directory
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = [];

// Listen for connection events from clients
io.on('connection', function(socket) {
  // Log to the console that a client has connected
  console.log('A client has connected');

  socket.on('get-clients', function(callback) {
    Object.keys(io.sockets.sockets).forEach(function(id) {
      clients.push(id);
    });
    clients.splice(clients.indexOf(socket.id), 1);
    callback(null, clients);
  });

  socket.on('request-details', function(data) {
    console.log(data.clientID);
  });

  // Listen for disconnect events from clients
  socket.on('disconnect', function() {
    // Log to the console that a client has disconnected
    console.log('A client has disconnected');

    clients.splice(clients.indexOf(socket.id), 1);
  });
});

// Start our http server on port 8080
http.listen(8080, function() {
  // Log to the console that we are listening
  console.log('listening on *:8080');
});
