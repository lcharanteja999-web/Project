const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type :String,
        required :true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },

    role:{
        type:String,
        enum:['user','admin'], //can only be 'user' or 'admin'
        default:'user',
    },
},{timestamps:true});  //automatically adds createdAt and updatedAt

module.exports = mongoose.model('User',userSchema);