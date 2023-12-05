import express from 'express'
import http from 'http'
import { initSocket } from './socket.js'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv';
import router from './router.js'
import auth from './auth.js'

dotenv.config()

// Server initialization
const corsOptions = {
   origin: 'http://localhost:3000'
}
const app = express()
const server = http.createServer(app)

// Server configuration
app.use(cors(corsOptions))
app.use(express.json());

// Socket initialization
initSocket(server)

// Database configuration and connection
mongoose.connect(process.env.DB_URL)
   .then(() => {
      console.log("Connesso al DB");
      // Server listening on port 8000
      server.listen(8000, () => {
         console.log('Server listening on port 8000');
      });
   })

// Routes configuration
app.use('/', router)

app.get('/auth', auth, (request, response) => {
   console.log(request.token)
   response.json({ message: "Authorized!" })
})




// Socket
