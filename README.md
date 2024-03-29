# NodeMusic
> A set of client and server scripts that start, and monitor, an ffmpeg/ffplay
stream.

Recently we were required to broadcast a single audio source to a number of
endpoints in a modular fashion with easy administration. NodeMusic was written
to help simplify that project and allow endpoints to easily connect and get
their instructions.

## Installation
1. Make sure that ffmpeg is installed on the server and client(s)
```sh
sudo apt-get update
sudo apt-get install ffmpeg
```

2. Make sure that node and npm are both installed on the server and the client(s)
```sh
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install nodejs
sudo apt install npm
```

3. Verify that node.js and npm were installed successfully
```sh
node --version
v12.10.0

npm --version
6.11.3
```

4. Verify that ffmpeg was installed successfully
```sh
which ffmpeg
/usr/bin/ffmpeg

which ffplay
/usr/bin/ffplay
```

5. Clone the NodeMusic repository
```sh
git clone https://github.com/pyladin/nodemusic.git myproject
cd myproject
npm install
```

## Usage example
1. On the server and client(s), rename the ".env.example" file to ".env"
```sh
cp .env.example .env
```

2. On the server, create the "master.sdp" file by running the full ffmpeg command and copying the SDP portion to "master.sdp"
```sh
touch master.sdp
ffmpeg -i STREAM_SOURCE -acodec AUDIO_CODEC, -f BROADCAST_FORMAT, rtp://BROADCAST_ADDRESS:BROADCAST_PORT
```

3. Update the ".env" file with the necessary settings

4. Start the server script on the server
```sh
npm start
```

5. Start the client script on the client
```sh
node client.js
```

## Release History
* 0.0.1
    * Work in progress

## Meta
Nico Bressler – [@Pyladin](https://twitter.com/pyladin) – nbressler@ci.lebanon.or.us
