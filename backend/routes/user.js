const express = require('express');
const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/verifyuser');
const app = express.Router();
app.get('/',async (req,res) => {
  return res.write("HELLO DMS");
})
app.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!(fullname && email && password)) {
      return res.status(400).json({ message: 'All fields are compulsory' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ message: 'User already exists' });
    }

    const EncPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name:fullname, email, password: EncPassword });

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET);
    user.password = undefined;
    const options = {
      httpOnly: true,
      secure: true, 
      sameSite: 'None' 
    };
    return res.status(200).cookie("token", token,options).json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/login', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      return res.status(400).json({ message: 'Send all data' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET);
      user.token = token;
      user.password = undefined;

      const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      };
      return res.status(200).cookie("token", token,options).json({ success: true, user });
    }
    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post('/logout',authenticateToken,async (req,res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  };
  res.clearCookie("token",options);
  
  return res.status(200).json({ success: true });
  
});

module.exports = app;
