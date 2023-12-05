import jwt from 'jsonwebtoken'

const auth = (request, response, next) => {
   try {
      const token = request.headers.authorization.split(" ")[1]
      request.token = jwt.verify(token, 'secret')
      next()
   }
   catch (err) {
      response.status(401).send({
         message: "Not authorized",
         err
      })
   }
}
export default auth




