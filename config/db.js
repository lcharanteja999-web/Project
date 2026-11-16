const mongoose = require('mongoose'); //mongoose is a library that helps NODE.JS communicate with MongoDB

const connectDB = async()=>{

    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);  //MONGO_URI is the variable containing your MongoDB connection string.
        console.log(`MongoDB Connected: ${conn.connection.host}`);    //This line prints the MongoDB server hostname after a successful connection.
    }
    catch(error){
        console.log(`Error: ${error.message}`);
        process.exit(1)  //stop the server if DB fails
    }
};

module.exports = connectDB;