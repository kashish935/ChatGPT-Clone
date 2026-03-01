const {Server} = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const aiService = require('../services/ai.service');
const messageModel = require('../models/message.model');
const {createMemory, queryMemory} = require('../services/vector.service');

function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            allowedHeaders : ["Content-Type", "Authorization"],
            credentials: true
        }//socket io server ko initialize karna hoga aur cors policy set karni hogi taki frontend se connection allow ho sake
    })

    io.use(async(socket, next)=> {
        //middleware for authentication can be added here for socket

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if(!cookies.token){
            next(new Error('Authentication error:No token provided'));
        }

        // Here you can verify the token and attach user info to socket if needed
        try{
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user = await userModel.findById(decoded.id);

            socket.user = user;

            next();

        }catch(err){
            next(new Error('Authentication error:Invalid token'));
        }

    })

    io.on('connection', (socket) => {
        
        console.log("User connected" , socket.user._id);
        

        socket.on("ai-message", async(messagePayload) => {

            const [message, vectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: messagePayload.content,
                    role: 'user'
                }),//client se aayi message ko database me save karna hoga
                aiService.generteVector(messagePayload.content), //vectors genertion for client
            ])

            await createMemory({
                vectors,
                messageId:message._id, //unique
                metadata:{
                    chat: messagePayload.chat,
                    user : socket.user._id,
                    text: messagePayload.content
                }
                })//message ke vector ko pinecone me save karna hoga taki future me uske basis pe similar messages ko retrieve karke ai service me bheja ja sake for better response

            const [memory, chatHistory] = await Promise.all([
                queryMemory({
                    queryVector: vectors,
                    limit:3,
                    metadata : {
                        user: socket.user._id
                    }
                }),//retrieving similar messages from pinecone based on the current message vector
                messageModel.find({
                    chat: messagePayload.chat
                }).sort({createdAt: -1}).limit(20).lean().then(messages => messages.reverse())//chat history ko ai service me bhejna hoga taki wo context samajh ke response de sake, yaha hum latest 20 messages le rahe hai taki short term memory ke liye kaafi ho
            ])

            const stm =  chatHistory.map(item =>{
                return {
                    role: item.role,
                    parts : [{text: item.content}]
                }
            })

            const ltm = [{
                role: 'user',
                parts : [{text: `
                    these are some previous messages from chat, use them to generate a responnse.
                    
                    ${memory.map(item => item.metadata.text).join("\n")}

                    `}]
            }]

            const response = await aiService.generateResponse([...ltm, ...stm]);//ai service ko message history ke sath sath similar messages bhi bhejna hoga taki wo dono ko context me leke response generate kar sake, yaha hum long term memory ko system prompt ke through bhej rahe hai taki ai usko as a context samajh ke use kare response generate karte time

            socket.emit("ai-response", {
                content : response,
                chat: messagePayload.chat
            })

            const [responseMessage, responseVectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: response,
                    role: 'model'
                }),//ai k response ko bhi database me save karna hoga
                aiService.generteVector(response) //vectors part for ai response
            ])

            await createMemory({
                vectors: responseVectors,
                messageId: responseMessage._id,
                metadata:{
                    chat: messagePayload.chat,
                    user : socket.user._id,
                    text: response
                }
            })

        })
    })


}

module.exports = initSocketServer;