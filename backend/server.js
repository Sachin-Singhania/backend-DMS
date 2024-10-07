const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const app = express();
const morgan=require('morgan')
require('dotenv').config();
const userRoutes = require('./routes/user'); 
const uploadRoutes = require('./routes/upload'); 
const cors=require('cors');
app.use(express.json()); 
app.use(cookieParser());
app.use(morgan('dev'))

app.use(cors({
  
 origin:"http://localhost:5173",
   credentials: true,
 }));

let retryCount = 0;
const maxRetries = 2;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');
  } catch (err) {
    retryCount++;
    console.error(`MongoDB connection error: ${err.message}`);
    if (retryCount <= maxRetries) {
      console.log(`Retrying connection attempt ${retryCount}/${maxRetries}...`);
    } else {
      console.error('Max retries reached. Exiting...');
      process.exit(1); // Exit after reaching max retries
    }
  }
};

connectDB();



app.use('/api/user', userRoutes); 
app.use('/api/upload', uploadRoutes); 


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
