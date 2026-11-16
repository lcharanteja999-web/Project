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
  for (let i = 1; i <= 10; i++) {
    items.push({
      title: `Test Item ${i}`,
      description: `This is description for item ${i}`,
      category: i % 2 === 0 ? 'Electronics' : 'Books',
      location: 'Library',
      date: new Date(),
      type: i % 2 === 0 ? 'lost' : 'found',
      reportedBy: user._id
    });
  }

  await Item.insertMany(items);
  console.log("10 Items inserted!");
  process.exit();
};
seed();