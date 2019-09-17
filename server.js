var app = require('express')(); // Required for web server functionality
var http = require('http').createServer(app); // Starts and creates an http server
var io = require('socket.io')(http); // Starts the socket.io server which clients connect to
var { spawn } = require('child_process'); // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables

// Initialize dotenv
dotenv.config();

// Turn off polling and only use websockets
// This resolves some strange issues where music would randomly stop streaming
io.set('transports', ['websocket']);

// Serve up an html file at the root
// This will be modified later to allow for some admin controls
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

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
    var ffmpegCmd = spawn('ffmpeg', [ffmpegArgs.streamSource, ffmpegArgs.audioCodec, ffmpegArgs.broadcastFormat, ffmpegArgs.broadcastUrl], { shell: true });

    ffmpegCmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpegCmd.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    // Write to the console to notify that ffmpeg is started
    console.log('ffmpeg has started');
  } else {
    // If ffmpeg is already running
    console.log('ffmpeg is already running');
  };
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

// Emit the "send-ffplay" event to a client when it connects to start playing the stream
io.on('connect', function(socket) {
  // Write to the console to notify that a client has connected
  console.log('A new client has connected.')

  // Send the ffplay arguments that we want the client to use
  socket.emit('start-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });

  setInterval(() => {
    socket.emit('check-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });
  }, 1000);

  // Listen for the client-details event
  socket.on('client-details', function(data) {
    console.log('Client Name: ' + data.clientName);
    console.log('Client Location: ' + data.clientLocation);
  });

  // Write to the console to notify that a client has disconnected
  socket.on('disconnect', function() {
    console.log('a user disconnected');
  });

});

// Start the server listening on port 8080
http.listen(8080, function() {
  console.log('listening on *:8080');
});
