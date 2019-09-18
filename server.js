var app = require('express')(); // Allows us to serve up http pages easily
var http = require('http').createServer(app); // Creates our http server
var io = require('socket.io')(http); // Creates our socket.io server

// Send the home page when get request made to root directory
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Listen for connection events from clients
io.on('connection', function(socket) {
  // Log to the console that a client has connected
  console.log('A client has connected');

  socket.on('request-client-details', function() {
    io.emit('send-client-details');
  });

  socket.on('forward-client-details', function(data) {
    io.emit('client-details', data);
  });

  socket.on('start-ffmpeg', function() {
    console.log('Web console made request to start ffmpeg.');
  });

  socket.on('stop-ffmpeg', function() {
    console.log('Web console made request to stop ffmpeg.');
  });

  socket.on('start-ffplay', function(data) {
    io.to(`${data}`).emit('start-ffplay');
  });

  socket.on('stop-ffplay', function(data) {
    io.to(`${data}`).emit('stop-ffplay');
  });

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
