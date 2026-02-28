const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,//stores the id of the user who created the chat
        ref: 'user',//reference to the user model
        required: true
    },
    title:{
        type: String,
        required: true
    },
    lastActivity:{
        type: Date,
        default: Date.now
    }
},{
    timestamps: true
})

const chatModel = mongoose.model('chat', chatSchema);

module.exports = chatModel;