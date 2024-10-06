const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const app = express();
require('dotenv').config();
const userRoutes = require('./routes/user'); 
const uploadRoutes = require('./routes/upload'); 
const cors=require('cors');
app.use(express.json()); 
app.use(cookieParser());

const corsOptions = {
  // origin: 'http://localhost:5173', 
  origin: 'https://dms-organize.vercel.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
  credentials: true, 
};


// Use CORS middleware
app.use(cors(corsOptions));


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1); 
  }
};
connectDB();



app.use('/api/user', userRoutes); 
app.use('/api/upload', uploadRoutes); 


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
