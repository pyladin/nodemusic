var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var socket = io('http://10.16.120.124:8080/', {transports: ['websocket'], upgrade: false}); // Connects us to the socket.io server
var { spawn } = require('child_process'); // // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running

// Connect to the server and write to the console that we've connected
socket.on('connect', function() {
  console.log('A connection to the server has been made.')
});

function ffplayStart(data) {
  find('name', 'ffplay', true)
  .then(function (list) {
    if(!list.length) {
      fs.writeFile('client.sdp', ffmpegArgs.sdpFile, function(err) {
        if(err) {
          console.log(err);
        };
        console.log('SDP file created successfully!');
      });
      var ffplayCmd = spawn('ffplay', [data.ffplayFlags.sdpFile, data.ffplayFlags.protocolWhitelist, data.ffplayFlags.reorderQueueSize], { shell: true });

      ffplayCmd.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
      });

      ffplayCmd.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      console.log('ffplay has started');
    } else {
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
