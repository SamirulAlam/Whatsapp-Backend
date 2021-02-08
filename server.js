//importing
import express from 'express';
import mongoose from 'mongoose';
import Pusher from "pusher";
import Messages from "./dbMessages.js";
import dotenv from 'dotenv';
dotenv.config();

//app config
const app = express();
const port=process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1152561",
    key: "b37a91dcc508f1129097",
    secret: "e18a0c9baa9cc7c865fa",
    cluster: "ap2",
    useTLS: true
  });


//middleware
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin","*"),
    res.setHeader("Access-Control-Allow-Headers","*"),
    next()
})
//DB config
const password=process.env.PASSWORD;
const connection_url=`mongodb+srv://admin:${password}@cluster0.nyibb.mongodb.net/whatsappdb?retryWrites=true&w=majority`
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
});
// magic
const db=mongoose.connection;
db.once("open",()=>{
    console.log("DB connected");

    const msgCollection=db.collection("messagecontents");
    const changeStream=msgCollection.watch();

    changeStream.on("change",(change)=>{
        console.log(change);

        if(change.operationType==="insert"){
            const messageDetails=change.fullDocument;
            pusher.trigger("messages","inserted",
                {
                    name:messageDetails.name,
                    message:messageDetails.message,
                    received:messageDetails.received
                }
            )
        }else{
            console.log("Error in pusher")
        }
    })
})
//api routes
app.get("/",(req, res) =>res.status(200).send("hello"));

app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
app.post("/messages/new",(req, res) =>{
    const dbMessage =req.body;

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data)
        }
    });
});
//listen
app.listen(port,()=>console.log(`listening on localhost:${port}`));