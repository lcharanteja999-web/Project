
const express = require('express');

const jwt = require('jsonwebtoken');

// Create a router to manage authentication routes
const router = express.Router();

// Import bcryptjs to convert passwords into hashed passwords
const bcrypt = require('bcryptjs');

// Import the User model to work with the User collection in MongoDB
const User = require('../models/User');


// POST route for registering a new user
// Full API URL: POST /api/auth/register

router.post('/register', async (req, res) => {

  try {

    // STEP 1: Get the user's name, email and password
    // req.body contains the data sent by the frontend or Postman

    const { name, email, password } = req.body;


    // STEP 2: Check whether a user with this email already exists
    // findOne() searches MongoDB for one matching user
    // await waits until the database search is completed

    const userExists = await User.findOne({ email });


    // STEP 3: If the email already exists, stop registration
    // Send status 400 with an error message
    // return stops the remaining code from executing

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }


    // STEP 4: Generate a random salt
    // Salt is used by bcrypt when creating a password hash
    // 10 is the cost factor

    const salt = await bcrypt.genSalt(10);


    // STEP 5: Convert the original password into a hashed password
    // password contains the original password entered by the user
    // hashedPassword stores the newly generated password hash
    // We never save the original password directly in MongoDB

    const hashedPassword = await bcrypt.hash(password, salt);


    // STEP 6: Create a new user in MongoDB
    // User.create() creates a new user document
    // name and email contain the user's original details
    // password: hashedPassword means we save the hashed password
    // in the password field, not the original password

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });


    // STEP 7: Send a success response to the frontend
    // 201 means a new user was successfully created
    // We send only the user's ID, name and email
    // We do not send the password in the response

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });


  } catch (error) {

    // STEP 8: Handle errors
    // If something goes wrong, the catch block executes
    // 500 means an internal server error

    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Server error'
    });

  }

});


router.post('/login',async(req,res)=>{
  try{
    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({message:'Ivalid credentials'});
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
      return res.status(400).json({message:'Ivalid credentials'});
    }

    const token = jwt.sign(
      {id:user._id,role:user.role},
      process.env.JWT_SECRET,
      {expiresIn:'1d'}
    );

    res.json({token,user:{id:user._id,name:user.name,role:user.role}});
  }
  catch(error){
    res.status(500).json({message:'Server error'});
  }
});


// STEP 9: Export the router
// This allows us to import and use these routes in server.js

module.exports = router;
