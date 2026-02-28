const moongoose = require('mongoose');

const userSchema = new moongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    fullName:{
        firstName:{
            type:String,
            required:true,
        },
        lastName:{
            type:String,
            required:true,
        }
    },
    password:{
        type:String,
    }
},
    {
        timestamps:true,//createdAt and updatedAt vo hm data add krdega automatically
    }
);

const userModel = moongoose.model("user", userSchema);

module.exports = userModel;