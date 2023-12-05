import { Server } from 'socket.io'
import * as board from './board.js'


export let emitSample
export let emitAlert
export let emitImpedanceTest
export let emitConnection
export let emitMsg

export const initSocket = (server) => {
   const io = new Server(server, {
      cors: true
   })

   io.on('connection', (socket) => {
      console.log(`${socket.id} si è connesso`)

      socket.on('connectHeadset', () => {
         board.connect()
         socket.on('stop', () => {
            board.stopStreaming()
         })
      })

      socket.on('startStream', () => {
         board.startSending()
      })

      socket.on('startImpedanceTest', async () => {
         board.impedanceTest().then((impedanceArray) => {
            const newImpArr = impedanceArray.map(channel => channel.P)
            console.log(newImpArr)

            let result = true
            newImpArr.forEach((channel, index) => {
               if (channel.text !== 'init') {
                  if (channel.text === 'none' || channel.text === 'bad') {
                     result = false
                     return
                  }
               }
            })
            io.to(socket.id).emit('impedanceTestResult', { result: result })
            console.log('fatto')

         })
      })

      emitSample = (sample) => {
         io.to(socket.id).emit('sample', { data: sample.channelData, timestamp: sample.timestamp })
      }

      emitAlert = (alert) => {
         io.to(socket.id).emit('alert', alert)
      }
      emitImpedanceTest = (msg) => {
         io.to(socket.id).emit('impedanceTest', msg)
      }
      emitConnection = (result) => {
         io.to(socket.id).emit('connectionResult', result)
      }
      emitMsg = (msg) => {
         io.to(socket.id).emit('msg', msg)
      }

      socket.on('disconnect', () => {
         console.log(`${socket.id} si è disconnesso`)
         socket.removeAllListeners(['sample'])
         socket.removeAllListeners(['start'])
         socket.removeAllListeners(['stop'])
         board.stopStreaming()
      })
   })

   return io
}