const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
const UserModel = require('./controller')
const nodemailer = require('nodemailer')
require('dotenv').config();

const PORT = process.env.PORT;


const app = express()
app.use(express.json())
app.use(cors({
    origin: ["https://darling-tartufo-a98181.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true
}))
app.use(cookieParser())

///mongodb connection

mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`);


//user verify. if admin those path is dashboard
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json("token is missing")
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json("Error with token")
            } else {
                if (decoded.role === "admin") {
                    next()
                } else {
                   return res.json("not admin")
                }
            }
        })
    }
}

app.get('/dashboard', verifyUser, (req, res) => {
    res.json("Success")
})


//signup page  api
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    bcrypt.hash(password, 10)
        .then(hash => {
            UserModel.create({ name, email, password:hash })
                .then(user => res.json({ status: 200 }))
                .catch(err => res.json(err))
    }).catch(err => res.json(err))
})

//login page api
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    UserModel.findOne({ email: email })
        .then(user => {
            if (user) {
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response) {
                        const token = jwt.sign({ email: user.email, role: user.role },
                            "jwt-secret-key", { expiresIn: "1d" })
                        res.cookie('token', token)
                        return res.json( {status:"Success", role:user.role})
                    } else {
                        return res.json("the password is incorrect")
                }
            })
            } else {
                return res.json("No record existed")
        }
    })
})

// This API will handle generate a token then it will send an email to the user:

app.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    UserModel.findOne({email: email})
    .then(user => {
        if(!user) {
            return res.send({Status: "User not existed"})
        } 
        const token = jwt.sign({id: user._id}, "jwt_secret_key", {expiresIn: "1d"})
        var transporter = nodemailer.createTransport({
  service: 'gmail',
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
          });
          
          var mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset Password Link',
            text: `https://darling-tartufo-a98181.netlify.app/${user._id}/${token}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send({Status: "Success"})
            }
          });
    })
})

// // In the Reset Password component user will enter a new password and press the button after that it will move to the server side:


app.post('/reset_password/:id/:token', (req, res) => {
    const {id, token} = req.params
    const {password} = req.body

    jwt.verify(token, "jwt_secret_key", (err, decoded) => {
        if(err) {
            return res.json({Status: "Error with token"})
        } else {
            bcrypt.hash(password, 10)
            .then(hash => {
                UserModel.findByIdAndUpdate({_id: id}, {password: hash})
                .then(u => res.send({Status: "Success"}))
                .catch(err => res.send({Status: err}))
            })
            .catch(err => res.send({Status: err}))
        }
    })
})

app.listen(PORT, () => {
    console.log(`server is running${PORT}`);
})