const express=require('express')
const app=express()
const mongoose=require('mongoose')
const PORT =5000
const {MONGOURI}=require('./keys')



/*MONGODB CONNECTION START*/
//o7nYFVRDPyJY8eMf
//mongodb+srv://trisha:<password>@cluster0.mc8nq.mongodb.net/<dbname>?retryWrites=true&w=majority
mongoose.connect(MONGOURI,{
useNewUrlParser:true,
useUnifiedTopology:true
})
mongoose.connection.on('connected',()=>{
    console.log("Connected to mongodb")
})
mongoose.connection.on('error',(err)=>{
    console.log("Error connecting",err)
})
/*MONGODB CONNECTION END*/

require('./models/user')

app.use(express.json())
app.use(require('./routes/auth'))




app.get('/home',(req,res)=>{
    res.send("hello world")
})

app.listen(PORT,()=>{
console.log("server is running on ",PORT)
})