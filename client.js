var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables

// Initialize dotenv
dotenv.config();

// Connect to our socket.io server after initializing the environment variables
var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT);

// Listen for a successfull connection to the socket.io server
socket.on('connect', function() {
  // Log to the console when we have successfully connected to the socket.io server
  console.log('A connection to the server has been made.');

  socket.on('get-details', function() {
    console.log('I hear you!');
  });
});
