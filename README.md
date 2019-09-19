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
1. Start the server script on the server
```sh
npm start
```

2. Start the client script on the client
```sh
node client.js
```

## Release History
* 0.0.1
    * Work in progress

## Meta
Nico Bressler – [@Pyladin](https://twitter.com/pyladin) – nbressler@ci.lebanon.or.us
