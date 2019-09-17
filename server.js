var app = require('express')(); // Allows us to serve up http pages easily
var http = require('http').createServer(app); // Creates our http server
var io = require('socket.io')(http); // Creates our socket.io server
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables
var { spawn } = require('child_process'); // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running

// Initialize dotenv
dotenv.config();

// Find if ffmpeg is already started and don't start another one
find('name', 'ffmpeg', true)
.then(function (list) {
  if(!list.length) {
    // If ffmpeg is not running
    // Start ffmpeg and store the process in a variable so we can do things to it
    var ffmpegCmd = spawn('ffmpeg', [`-i ${process.env.STREAM_SOURCE}`, `-acodec ${process.env.AUDIO_CODEC}`, `-f ${process.env.BROADCAST_FORMAT}`, `rtp://${process.env.BROADCAST_ADDRESS}:${process.env.BROADCAST_PORT}`], { shell: true });

    // Write stdout to the console
    ffmpegCmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    // Write stderr to the console
    ffmpegCmd.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  } else {
    // If ffmpeg is already running
    console.log('ffmpeg is already running');
  };
});

// Set the flags that we want our clients to use when calling ffplay
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

// Send the home page when get request made to root directory
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Listen for connection events from clients
io.on('connection', function(socket) {
  // Log to the console that a client has connected
  console.log('A client has connected');

  // Send the "start-ffplay" event every second to make sure that ffplay is started and running
  setInterval(() => {
    socket.emit('start-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });
  }, 1000);

  // Listen for the "ask-client-details" event and then emit a
  // "request-client-details" event to all the clients.
  socket.on('ask-client-details', function() {
    io.emit('request-client-details');
  });

  // Listen for the "send-client-details" event and then emit a
  // "update client-details" event to all the clients
  socket.on('send-client-details', function(clientDetails) {
    // io.emit('update-client-details', { clientDetails });
    console.log(clientDetails);
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
