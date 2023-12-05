import Cyton from "openbci_cyton"
import * as socket from './socket.js'

let portName = '/dev/cu.usbserial-3'
let buffer = []
let bufferInterval

let ourBoard

export function stopStreaming() {
   if (ourBoard?.isConnected())
      if (ourBoard?.isStreaming()) {
         ourBoard.streamStop().then(() => ourBoard.disconnect())
         clearInterval(bufferInterval)
      }
}

export function connect() {
   return new Promise((resolve, reject) => {
      ourBoard = new Cyton({
         simulate: true,
         simulatorSampleRate: 100,
      });
      if (!ourBoard.isConnected()) {
         ourBoard.connect(portName)
            .then(() => {
               console.log("Connected to device!")
               ourBoard.streamStart()
                  .then(() => {
                     socket.emitConnection({ isConnected: true, msg: 'Connessione avvenuta con successo!' })
                  })
                  .catch(err => {
                     console.log(err)
                     console.log('Stream error')
                     socket.emitConnection({ isConnected: false, msg: 'Errore durante la connessione al caschetto' })
                  });
            })
            .catch(err => {
               console.log(err)
               console.log('Connection error')
               socket.emitConnection({ isConnected: false, msg: 'Errore durante la connessione al caschetto' })
            });
      }
   })
}

export function impedanceTest() {
   return new Promise((resolve, reject) => {
      if (ourBoard?.isConnected())
         if (ourBoard?.isStreaming()) {
            ourBoard.once("impedanceArray", impedanceArray => {

               resolve(impedanceArray)
            });
            ourBoard.impedanceTestChannels(['p', 'p', '-', '-', '-', '-', 'p', 'p'])
               .then(ob => {
                  socket.emitImpedanceTest("Test impedenza in corso...")

               })
            console.log("Testing impedence...")
         }
   })
}

export function startSending() {
   if (ourBoard?.isConnected() && ourBoard?.isStreaming()) {
      ourBoard.on('sample', (sample) => {
         // console.log(sample)
         socket.emitSample(sample)

         // Inserisco i sample nel buffer da inviare all'API python
         buffer.push(sample.channelData)
      });

      // Uso setInterval per inviare periodicamente un buffer di sample all'API pyhton
      // bufferInterval = setInterval(() => {
      //    sendBuffer(buffer)
      // }, 4000)
   }
}

const sendBuffer = buffer => {
   console.log("Invio buffer...")
   fetch(`http://127.0.0.1:8080/buffer`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify(buffer)
   })
      .then(res => res.text())
      .then(res => {
         socket.emitAlert('ALERT')
      })
      .catch(err => console.log(err))
}
