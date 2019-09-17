var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables
var { spawn } = require('child_process'); // // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running

// Initialize dotenv
dotenv.config();

// Connect to our socket.io server after initializing the environment variables
var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT);

// Listen for a successfull connection to the socket.io server
socket.on('connect', function() {
  // Log to the console when we have successfully connected to the socket.io server
  console.log('A connection to the server has been made.');

  // Listen for the "start-ffplay" event and then start ffplay
  socket.on('start-ffplay', function(data) {
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
  });

  // Listen for the "request-client-details" event and then emit a
  // "send-client-details" event back to the server
  socket.on('request-client-details', function() {
    clientDetails = {
      clientName: process.env.CLIENT_NAME,
      clientLocation: process.env.CLIENT_LOCATION,
      clientID: socket.id
    };
    socket.emit('send-client-details', { clientDetails })
  });
});
