const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Item = require('./models/Item');
const User = require('./models/User');
dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Get the first user to be the owner of these items
  const user = await User.findOne(); 
  if(!user) return console.log("Register a user first!");

  const items = [];
  for (let i = 1; i <= 3; i++) { // Changed to 3
    items.push({
      title: i === 1 ? "Black HRX Bag" : i === 2 ? "Student ID Card" : "Blue Water Bottle",
      description: i === 1 ? "Left near the canteen table." : i === 2 ? "Found near library entrance." : "Steel bottle with a sticker.",
      category: i === 1 ? 'Bag' : i === 2 ? 'ID Card' : 'Other',
      location: 'Library',
      date: new Date(),
      type: i === 1 ? 'lost' : 'found',
      reportedBy: user._id
    });
  }

  await Item.insertMany(items);
  console.log("10 Items inserted!");
  process.exit();
};
seed();