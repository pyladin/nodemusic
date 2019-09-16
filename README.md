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
sudo apt-get install ffmpeg
```

2. Verify that ffmpeg was installed successfully
```sh
which ffmpeg
/usr/bin/ffmpeg

which ffplay
/usr/bin/ffplay
```

3. Clone the NodeMusic repository
```sh
git clone https://github.com/pyladin/nodemusic.git myproject
cd myproject
npm install
```

4. Start the server script
```sh
npm start
```

5. Start the client script
```sh
node client.js
```

## Usage example
> To be written

## Release History
* 0.0.1
    * Work in progress

## Meta
Nico Bressler – [@Pyladin](https://twitter.com/pyladin) – nbressler@ci.lebanon.or.us
