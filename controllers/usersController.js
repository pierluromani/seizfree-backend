import User from "../db/models/userModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


export const register = (request, response) => {
   bcrypt.hash(request.body.password, 10)
      .then(hashedPassword => {
         const user = new User({
            email: request.body.email,
            firstname: request.body.firstname,
            lastname: request.body.lastname,
            password: hashedPassword
         })
         user.save()
            .then((result) => {

               response.status(201).send({
                  message: "User Created Successfully",
                  result,
               });
            })
            .catch((error) => {
               response.status(500).send({
                  message: "Email already exists",
                  error,
               });
            });
      })
      .catch((err) => {
         response.status(500).send({
            message: "Password was not hashed successfully",
            err,
         });
      });
}

export const login = (request, response) => {
   User.findOne({ email: request.body.email })
      .then((user) => {
         bcrypt.compare(request.body.password, user.password)
            .then((result) => {
               if (!result) {
                  response.status(400).send({
                     message: "Incorrect password",
                     err
                  })
               } else {
                  const token = jwt.sign({
                     userId: user._id,
                     userEmail: user.email,
                  }, 'secret', { expiresIn: '24h' })
                  response.status(200).send({
                     message: "Login successful",
                     user: user,
                     token: token
                  })
               }
            })
            .catch((err) => {
               response.status(400).send({
                  message: "Incorrect password",
                  err
               })
            })
      })
      .catch((err) => {
         response.status(404).send({
            message: "Email not found, please register",
            err
         })
      })
}
