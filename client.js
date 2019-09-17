var io = require('socket.io-client');
var dotenv = require('dotenv');

dotenv.config();

var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT);

socket.on('connect', function() {
  console.log('A connection to the server has been made.');

  socket.on('request-client-details', function() {
    socket.emit('send-client-details', { clientName: process.env.CLIENT_NAME, clientLocation: process.env.CLIENT_LOCATION });
  });
});
