var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('A client has connected');

  socket.on('ask-client-details', function() {
    io.emit('request-client-details');
  });

  socket.on('send-client-details', function(data) {
    io.emit('update-client-details', {clientName: data.clientName, clientLocation: data.clientLocation });
  });

  socket.on('disconnect', function() {
    console.log('A client has disconnected');
  });
});

http.listen(8080, function() {
  console.log('listening on *:8080');
});
