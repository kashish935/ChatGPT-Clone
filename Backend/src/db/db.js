const moongoose = require('mongoose');

async function connectDB() {

    try{
        await moongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB");
    }catch(err){
        console.log("Database connection failed", err);
    }

}

module.exports = connectDB;