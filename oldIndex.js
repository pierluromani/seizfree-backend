
const Cyton = require("openbci_cyton");
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
   cors: true
})

server.listen(8000, () => {
   console.log('listening on *:8000');
});

const ourBoard = new Cyton({
   simulate: true,
});

let portName = '/dev/cu.usbserial-3'
let buffer = []
let bufferInterval

function stopStreaming() {
   if (ourBoard.isConnected())
      if (ourBoard.isStreaming()) {
         ourBoard.streamStop().then(() => ourBoard.disconnect())
         clearInterval(bufferInterval)
      }
}

io.on('connection', (socket) => {
   console.log("connesso")
   socket.on('disconnect', () => {
      console.log("disconnesso")
      stopStreaming()
   })

   socket.on('start', () => {
      if (!ourBoard.isConnected()) {
         console.log("Connecting to board...")
         ourBoard.connect(portName).then(() => ourBoard.softReset())
            .then(() => {
               console.log("Connected to board...")
               // ourBoard.on('ready', () => {
               console.log("READY")
               ourBoard.streamStart()
               ourBoard.impedanceTestChannels(['p', 'p', 'p', 'p', '-', '-', '-', '-']).
                  then(impedanceObject => {
                     ourBoard.on('sample', (sample) => {
                        socket.emit('sample', { data: sample.channelData, timestamp: sample.timestamp })
                        buffer.push(sample.channelData)
                     });
                     bufferInterval = setInterval(() => {
                        console.log("Buffer inviato")
                     }, 4000)
                  })
               // })
            })
      }
   })
   socket.on('stop', () => {
      stopStreaming()
   })
})