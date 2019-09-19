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

  // Declare a variable so we can update it with our ffmpeg PID
  let ffmpegPID = null;

  // Listen for the request-client-details event from the web page
  socket.on('request-client-details', function() {
    // Send the send-client-details event to everyone
    io.emit('send-client-details');
  });

  // Listen for the forward-client-details event from the clients
  socket.on('forward-client-details', function(data) {
    // Send the client-details event to everyone
    io.emit('client-details', data);
  });

  // Listen for the start-ffmpeg event from the web page
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
      // If ffmpeg is not running
      if(!list.length) {
        // Start ffmpeg and store the process in a variable so we can do things to it
        var ffmpegCmd = spawn('ffmpeg', [ffmpegArgs.streamSource, ffmpegArgs.audioCodec, ffmpegArgs.broadcastFormat, ffmpegArgs.broadcastUrl], { shell: true, detatched: true });

        /// !!!! ---- This may seem like a dumb thing to have but it's not ---- !!!!
        /// !!!! ---- Without this ffmpeg/ffplay become unstable ---- !!!!
        // Write to the console when data is received on stdout
        ffmpegCmd.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        /// !!!! ---- This may seem like a dumb thing to have but it's not ---- !!!!
        /// !!!! ---- Without this ffmpeg/ffplay become unstable ---- !!!!
        // Write to the console when data is received on stdout
        ffmpegCmd.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        // Write to the console to notify that ffmpeg is started
        // When ffmpeg is started, the PID that it starts with is normally
        // +1 from what child_process reports.
        ffmpegPID = ffmpegCmd.pid;
        console.log('ffmpeg has started with PID: ' + ffmpegPID);
      } else {
        // If ffmpeg is already running
        console.log('ffmpeg is already running');
      };
    });
  });

  // Listen for the stop-ffmpeg event from the web page
  socket.on('stop-ffmpeg', function() {
    console.log('Web console made request to stop ffmpeg.');
    // Find if an instance of the ffplayPID is running
    find('pid', ffmpegPID, true)
    .then(function (list) {
      // If it's not found either something went wrong or it's not running running
      if(!list.length) {
        console.log('ffmpeg has already been stopped.');
      } else {
        // If it is found, kill it like we were asked
        process.kill(ffmpegPID);
      };
    });
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

  // Listen for the start-ffplay event from the web page
  socket.on('start-ffplay', function(data) {
    // Send the start-ffplay event to the specific client requested by the web page
    io.to(`${data}`).emit('start-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });
  });

  // Listen for the stop-ffplay event from the web page
  socket.on('stop-ffplay', function(data) {
    // Send the stop-ffplay event to the specific client requested by the web page
    io.to(`${data}`).emit('stop-ffplay');
  });

  // Listen for the set-volume event from the web page
  socket.on('set-volume', function(data) {
    // Send the change-volume event to the specific client requested by the web page
    io.to(`${data.clientID}`).emit('change-volume', { volumeValue: data.volumeValue });
  });

  // Listen for the request-volume event from the web page
  socket.on('request-volume', function() {
    // Send the get-volume event to everyone
    io.emit('get-volume');
  });

  // Listen for the current-volume event from the client
  socket.on('current-volume', function(data) {
    console.log("Client: " + data.clientID + " volume has been changed and needs to be updated to: " + data.volumeValue);
    // Send the update-volume event to everyone (the server is the only one listening)
    io.emit('update-volume', data);
  });

  // Listen for the volume-changed event from the client
  socket.on('volume-changed', function(data) {
    console.log("Client: " + data.clientID + " volume has been changed and needs to be updated to: " + data.volumeValue);
    // Send the update-volume event to everyone (the server is the only one listening)
    io.emit('update-volume', data);
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
