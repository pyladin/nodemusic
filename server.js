var app = require('express')(); // Allows us to serve up http pages easily
var http = require('http').createServer(app); // Creates our http server
var io = require('socket.io')(http); // Creates our socket.io server
var { spawn } = require('child_process'); // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables

// Initialize dotenv
dotenv.config();

// Send the home page when get request made to root directory
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Listen for connection events from clients
io.on('connection', function(socket) {
  // Log to the console that a client has connected
  console.log('A client has connected');

  var ffmpegPID = null;

  socket.on('request-client-details', function() {
    io.emit('send-client-details');
  });

  socket.on('forward-client-details', function(data) {
    io.emit('client-details', data);
  });

  socket.on('start-ffmpeg', function() {
    console.log('Web console made request to start ffmpeg.');
    // Declare our ffmpeg arguments
    ffmpegArgs = {
      streamSource: '-i ' + process.env.STREAM_SOURCE, // Will be updated to a sound card stream after testing
      audioCodec: '-acodec ' + process.env.AUDIO_CODEC, // Allows for high quality streaming
      broadcastFormat: '-f ' + process.env.BROADCAST_FORMAT, // Allows for multicast streaming
      broadcastUrl: 'rtp://' + process.env.BROADCAST_ADDRESS + ':' + process.env.BROADCAST_PORT // Specifes the multicast address the clients will be connecting to
    };

    // Find if ffmpeg is already started and don't start another one
    find('name', 'ffmpeg', true)
    .then(function (list) {
      if(!list.length) {
        // If ffmpeg is not running
        // Start ffmpeg and store the process in a variable so we can do things to it
        var ffmpegCmd = spawn('ffmpeg', [ffmpegArgs.streamSource, ffmpegArgs.audioCodec, ffmpegArgs.broadcastFormat, ffmpegArgs.broadcastUrl], { shell: true, detatched: true });

        ffmpegCmd.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        ffmpegCmd.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        ffmpegCmd.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
        });

        // Write to the console to notify that ffmpeg is started
        ffmpegPID = ffmpegCmd.pid + 1;
        console.log('ffmpeg has started with PID: ' + ffmpegPID);
      } else {
        // If ffmpeg is already running
        console.log('ffmpeg is already running');
      };
    });
  });

  socket.on('stop-ffmpeg', function() {
    console.log('Web console made request to stop ffmpeg.');
    process.kill(ffmpegPID);
  });

  // Set our ffplay flags that we will send to the client to use
  var ffplayFlags = {
    sdpFile: '-i ' + process.env.SDP_FILE, // Tells the client where the SDP file is located
    protocolWhitelist: '-protocol_whitelist ' + process.env.PROTOCOL_WHITELIST, // Ffplay requires us to whitelist protocols
    reorderQueueSize: '-reorder_queue_size ' + process.env.REORDER_QUEUE_SIZE // Undocumented flag to help with restarting/latency
  };

  // Read our master SDP file into a varialbe to be sent to the client
  try {
    var masterSDP = fs.readFileSync('master.sdp', 'utf8');
  } catch(err) {
    console.log('Error:', err.stack);
  }

  socket.on('start-ffplay', function({ ffplayFlags: ffplayFlags, sdpFile: masterSDP} ) {
    io.to(`${data}`).emit('start-ffplay', ffplayFlags);
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
