const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');


const app = express();


/* using Middlewares */
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests

})) // Enable CORS for all routes
app.use(express.json());
app.use(cookieParser());

//fronbtend se aane wale json data ko parse karne ke liye middleware use karna hoga
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from the "public" directory


/* Using Routes */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


app.get("*name" ,(req,res)=>{
    res.sendFile(path.join(__dirname, '../public/index.html'));
})// For any other route, serve the index.html file (for React Router)


module.exports = app;