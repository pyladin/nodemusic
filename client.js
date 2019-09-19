var io = require('socket.io-client'); // Allows us to connect to the socket.io server as a client without a browser
var dotenv = require('dotenv'); // Allows us to use an env file to store important variables
var { spawn } = require('child_process'); // Allows us to spawn ffmpeg and ffplay processes
var { exec } = require('child_process'); // Allows us to execute one-time commands
var fs = require('fs'); // Allows us to read and write files
var find = require('find-process'); // Allows us to check if the ffmpeg and ffplay processes area already running

// Initialize dotenv
dotenv.config();

// Connect to our socket.io server after initializing the environment variables
var socket = io('http://' + process.env.SERVER_ADDRESS + ':' + process.env.SERVER_PORT);

// Declare a variable so we can update it with our ffplay PID
let ffplayPID = null;

function getffplayPID(childProcess) {
  ffplayPID = childProcess.pid;
};

// Listen for a successfull connection to the socket.io server
socket.on('connect', function() {
  // Log to the console when we have successfully connected to the socket.io server
  console.log('A connection to the server has been made.');

  // Pull the volume level from the .env file
  var volumeValue = process.env.VOLUME;

  // Listen for the send-client-details event sent from the server
  socket.on('send-client-details', function() {
    var clientDetails = {
      clientName: process.env.CLIENT_NAME,
      clientLocation: process.env.CLIENT_LOCATION,
      clientID: socket.id
    };
    // Send the forward-client-details event back to the server
    socket.emit('forward-client-details', clientDetails);
  });

  // Listen for the start-ffplay event sent from the server
  socket.on('start-ffplay', function(data){
    // Find if a ffplay instance is already running
    find('name', 'ffplay', true)
    .then(function (list) {
      // If ffplay is not running
      if(!list.length) {
        // Build the client sdp file from the master sdp file sent from the server
        fs.writeFile('client.sdp', data.sdpFile, function(err) {
          if(err) {
            console.log(err);
          };
          console.log('SDP file created successfully!');
        });

        // Start ffplay and store the process in a variable so we can do things to it
        var ffplayCmd = spawn('ffplay', [data.ffplayFlags.sdpFile, data.ffplayFlags.protocolWhitelist, data.ffplayFlags.reorderQueueSize], { shell: true });

        /// !!!! ---- This may seem like a dumb thing to have but it's not ---- !!!!
        /// !!!! ---- Without this ffmpeg/ffplay become unstable ---- !!!!
        // Write to the console when data is received on stdout
        ffplayCmd.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        /// !!!! ---- This may seem like a dumb thing to have but it's not ---- !!!!
        /// !!!! ---- Without this ffmpeg/ffplay become unstable ---- !!!!
        // Write to the console when data is received on std error
        ffplayCmd.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        // Write to the console to notify that ffplay is started
        // When ffplay is started, the PID that it starts with is normally
        // +1 from what child_process reports.
        getffplayPID(ffplayCmd);
        console.log('ffplay has started with PID: ' + ffplayPID);
      } else {
        // If ffplay is already running
        console.log('ffplay is already running');
      };
    });
  });

  // Listen for the stop-ffplay event sent from the server
  socket.on('stop-ffplay', function(){
    console.log('Web console made request to stop ffplay.');
    // Find if an instance of the ffplayPID is running
    find('pid', ffplayPID, true)
    .then(function (list) {
      // If it's not found either something went wrong or it's not running running
      if(!list.length) {
        console.log('ffplay has already been stopped.');
      } else {
        // If it is found, kill it like we were asked
        process.kill(ffplayPID);
      };
    });
  });

  // Listen for the get-volume event sent from the server
  socket.on('get-volume', function() {
    // Send the current-volume event back to the server
    socket.emit('current-volume', {volumeValue: volumeValue, clientID: socket.id });
  });

  // Listen for the change-volume event sent from the server
  socket.on('change-volume', function(data) {
    // Set the volumeValue variable to what was sent from the server
    volumeValue = data.volumeValue;
    console.log('Web console made request to change volume level to: ' + volumeValue);

    // Execute the amixer command that allows us to set the volume
    exec('amixer -M sset PCM ' + volumeValue + '%', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);

      // Read the .env file and replace the VOLUME variable with the updated value
      // This allows us the ability to persistant volume through restarts
      fs.readFile('.env', 'utf8', function(err,data) {
        if (err) {
          console.log(err);
        };

        // Find, and replace, the VOLUME variable
        var result = data.replace(/VOLUME='\d+'|VOLUME=''/g, `VOLUME='${volumeValue}'`);

        // Write the .env file back
        fs.writeFile('.env', result, 'utf8', function (err) {
          if (err) {
            console.log(err);
          };
        });
      });
    });

    // Send the volume-changed event back to the server
    socket.emit('volume-changed', {volumeValue: volumeValue, clientID: socket.id });
  });
});
