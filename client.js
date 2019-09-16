var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var { spawn } = require('child_process'); // // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables
var loudness = require('loudness'); // Allows us to set, get and mute the client.

// Initialize dotenv
dotenv.config();

// Connect to our socket.io server after initializing the environment variables
var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT, {transports: ['websocket'], upgrade: false});

// Connect to the server and write to the console that we've connected
socket.on('connect', function() {
  // Write to the console to notify when a connection to the server is made
  console.log('A connection to the server has been made.')
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

      loudness.getMuted((err, mute) => {
        if (mute === true) {
          loudness.setMuted(false, (err) => {
            if (err) {
              console.log(err);
            };
          });
        } else {
          loudness.getVolume((err, vol) => {
            if (vol !== process.env.DEFAULT_VOLUME) {
              loudness.setVolume(process.env.DEFAULT_VOLUME, (err) => {
                if (err) {
                  console.log(err);
                };
              });
            };
          });
        };
      });

      // Start ffplay and store the process in a variable so we can do things to it
      var ffplayCmd = spawn('ffplay', [data.ffplayFlags.sdpFile, data.ffplayFlags.protocolWhitelist, data.ffplayFlags.reorderQueueSize], { shell: true });

      // Write to the console on stdout
      ffplayCmd.stdout.on('data', (data) => {
            console.log('stdout: ' + data.toString());
            ffmpegCmd.stdout.clearLine();
      });

      // Write to the console on stderr
      ffplayCmd.stderr.on('data', (data) => {
        console.error('stderr: ' + data.toString());
        ffmpegCmd.stderr.clearLine();
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
socket.on('send-ffplay', function(data) {
  ffplayStart(data);
});

// Listen for the "check-ffplay" event to see if we need to start ffplay again
socket.on('check-ffplay', function(data) {
  ffplayStart(data);
});