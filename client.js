var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var { spawn } = require('child_process'); // // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables

// Initialize dotenv
dotenv.config();

// Connect to our socket.io server after initializing the environment variables
var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT, {transports: ['websocket'], upgrade: false});

// Connect to the server and write to the console that we've connected
socket.on('connect', function() {
  // Write to the console to notify when a connection to the server is made
  console.log('A connection to the server has been made.')

  // Tell the server more information about those client
  var clientName = process.env.CLIENT_NAME;
  var clientLocation = process.env.CLIENT_LOCATION;
});

// Find if ffplay is already started and don't start another one
function ffplayStart(data) {
  find('name', 'ffplay', true)
  .then(function (list) {
    if(!list.length) {
      // If ffplay is not running
      // Build the client sdp file from the master sdp file sent from the server
      fs.writeFile('client.sdp', data.sdpFile, function(err) {
        if(err) {
          console.log(err);
        };
        console.log('SDP file created successfully!');
      });

      // Start ffplay and store the process in a variable so we can do things to it
      var ffplayCmd = spawn('ffplay', [data.ffplayFlags.sdpFile, data.ffplayFlags.protocolWhitelist, data.ffplayFlags.reorderQueueSize], { shell: true });

      //
      ffplayCmd.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      ffplayCmd.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      // Write to the console to notify that ffplay is started
      console.log('ffplay has started');
    } else {
      // If ffplay is already running
      console.log('ffplay is already running');
    };
  });
};

// Listen for the "send-ffplay" event from the server
socket.on('start-ffplay', function(data) {
  ffplayStart(data);
});

// Listen for the "check-ffplay" event to see if we need to start ffplay again
socket.on('check-ffplay', function(data) {
  ffplayStart(data);
});

// Listen for the "request-client-info" event
socket.on('request-client-info', function() {
  console.log('The server has requested my details.');
  socket.emit('client-details', { clientName: process.env.CLIENT_NAME, clientLocation: process.env.CLIENT_LOCATION });
});
