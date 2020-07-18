const express = require('express')
const router = express.Router() //used to create APIs

//to save user details to mongo db
const mongoose = require('mongoose')
const User = mongoose.model("User")
const crypto = require('crypto')
//Used for security purpose
const bcrypt = require('bcrypt') //used to hash password
const jwt = require('jsonwebtoken') //library to create jwt token
const { JWT_SECRET } = require('../keys') //gives a unique token to every entry
const requireLogin = require('../middleware/requireLogin') //middleware created between to verify the user during login

//Used for sending emails
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')


//SEND EMAIL FUNCTION STARTS
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "*********************************************************"
    }
}))
//SEND EMAIL FUNCTION ENDS


//GET ROUTE START
router.get('/signup', (req, res) => {
    res.sendfile('signup.html')
})
router.get('/signin', (req, res) => {
    res.sendfile('signin.html')
})
//GET ROUTE END

//SIGNUP ROUTE START
router.post('/signup', (req, res) => {
    const { name, email, password } = req.body //take user details from frontend
    if (!email || !name || !password) { //if these fields are not present ,it sends a error with a status code of 422
        return res.status(422).json({ error: "please add all the fields" })
    }
    User.findOne({ email: email }) //find user with the help of email
        .then((savedUser) => {
            if (savedUser) {
                return res.status(422).json({ error: "User already exists with that email" })
            }
            bcrypt.hash(password, 12)//hashed the password
                .then(hashedpassword => {
                    const user = new User({ //Creating a new user to save the details
                        email,
                        name,
                        password: hashedpassword
                    })
                    user.save()
                        .then(user => {
                            transporter.sendMail({  //sending mail to user email
                                to: user.email,
                                from: "no-reply@register.com",
                                subject: "signup success",
                                html: "<h2>Welcome to ou website</h2>"
                            })
                            res.json({ message: "saved successfully" })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                })

        })
        .catch(err => {
            console.log(err)
        })
})
//SIGNUP ROUTE END 

//SIGNIN ROUTE START
router.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(422).json({ error: "please add email or password" })
    }
    User.findOne({ email: email })
        .then(savedUser => {
            if (!savedUser) { //if user doesn't exist,send a error response
                return res.status(422).json({ error: "Invalid email or password" })
            }
            bcrypt.compare(password, savedUser.password) //compare the entered password with the existing one
                .then(doMatch => {
                    if (doMatch) {
                        //res.json({message:"Successfully signed in"})
                        const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET)//it returns a unique token for every user and convert the details into a token
                        res.json({ token })
                    } else {
                        res.status(422).json({ error: "Invalid email or password" })
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        })
})
//SIGNIN ROUTE END

//PASSWORD RESET ROUTE STARTS
router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {  //create a token
        if (err) {
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(422).json({ error: "User doesn't exist with that email" })
                }
                user.resetToken = token
                user.expireToken = Date.now() + 3600000
                user.save().then((result) => {
                    transporter.sendMail({
                        to: user.email,
                        from: "no-reply@register.com",
                        subject: "password-reset",
                        html: `
                                 <p>You requested for password reset</p>
                                    <h4>Click on this <a href="http://localhost:3000/reset/${token}">link</a> to reset password.</h4>
                           `
                    })
                    res.json({ message: "Check your email" })
                })
            })
    })
})
//PASSWORD RESET ROUTE ENDS

//NEW PASSWORD ROUTE STARTS
router.post('/new-password',(req,res)=>{
    const newPassword=req.body.password
    const sentToken=req.body.token
    User.findOne({resetToken:sentToken,expireToken:{$gt:Date.now()}})
    .then(user=>{
        if(!user){
            res.status(422).json({error:"Try again session expired"})
        }
        bcrypt.hash(newPassword,12).then(hashedpassword=>{
            user.password=hashedpassword
            user.resetToken=undefined
            user.expireToken=undefined
            user.save().then((savedUser)=>{
                res.json({message:"Password updated successfully"})
            })
        })
    })
    .catch(err=>{
        console.log(err)
    })
})
//NEW PASSWORD ROUTE ENDS

module.exports = router
