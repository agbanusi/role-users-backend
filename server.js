require('dotenv').config()
const express = require('express')
const mongodb = require('mongodb')
const routes = require('./functions/routes')
const cors = require('cors')
const bodyParser = require("body-parser")
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

function notFound(req, res, next){
    res.status(404).json({
        status:"Not Found",
        error:404,
        message:"Endpoint not found"
    })
}

mongodb.connect(process.env.DB, { useUnifiedTopology: true }, (err, client)=>{
    if(err){
         console.log(err)
         return
    }
    
    const db = client.db('Cluster0')
    routes(app, db)
    app.use(notFound)

    app.listen((process.env.PORT || 5000), ()=>{
        console.log("app listening at port " + (process.env.PORT || 5000))
    })
})

module.exports = app