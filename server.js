var app = require('express')(); // Required for web server functionality
var http = require('http').createServer(app); // Starts and creates an http server
var io = require('socket.io')(http); // Starts the socket.io server which clients connect to
var { spawn } = require('child_process'); // Allows us to spawn ffmpeg and ffplay processes
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running

// Turn off polling and only use websockets
io.set('transports', ['websocket']);

// Serve up an html file at the root
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Declare our ffmpeg arguments
ffmpegArgs = {
  streamSource: '-i http://50.7.68.251:6908/stream',
  audioCodec: '-acodec libvorbis',
  broadcastFormat: '-f rtp',
  broadcastUrl: 'rtp://239.124.124.1:8081'
};

// Find if ffmpeg is already started and don't start another one
find('name', 'ffmpeg', true)
.then(function (list) {
  if(!list.length) {
    var ffmpegCmd = spawn('ffmpeg', [ffmpegArgs.streamSource, ffmpegArgs.audioCodec, ffmpegArgs.broadcastFormat, ffmpegArgs.broadcastUrl], { shell: true });

    ffmpegCmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpegCmd.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    console.log('ffmpeg has started');
  } else {
    console.log('ffmpeg is already running');
  };
});

// Set our ffplay flags that we will send to the client to use
var ffplayFlags = {
  sdpFile: '-i client.sdp',
  protocolWhitelist: '-protocol_whitelist file,rtp,udp,rtsp',
  reorderQueueSize: '-reorder_queue_size 0'
};

// Read our master SDP file into a varialbe to be sent to the client
try {
  var masterSDP = fs.readFileSync('master.sdp', 'utf8');
} catch(err) {
  console.log('Error:', err.stack);
}

// Emit the "send-ffplay" event to a client when it connects to start playing the stream
io.on('connect', function(socket) {
  console.log('A new client has connected.')

  socket.emit('send-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });

  setInterval(() => {
    socket.emit('check-ffplay', { ffplayFlags: ffplayFlags, sdpFile: masterSDP });
  }, 1000);

  socket.on('disconnect', function() {
    console.log('a user disconnected');
  });
});

// Start the server listening on port 8080
http.listen(8080, function() {
  console.log('listening on *:8080');
});
