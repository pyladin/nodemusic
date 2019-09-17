var io = require('socket.io-client');
var dotenv = require('dotenv');

dotenv.config();

var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT);

socket.on('connect', function() {
  console.log('A connection to the server has been made.')
});
