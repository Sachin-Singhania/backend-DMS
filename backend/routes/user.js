const express = require('express');
const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/verifyuser');
const app = express.Router();

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!(name && email && password)) {
      return res.status(400).json({ message: 'All fields are compulsory' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ message: 'User already exists' });
    }

    const EncPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: EncPassword });

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET);
    user.password = undefined;

    return res.status(201).json({ user, token });

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

      // const options = {
      //   expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      //   httpOnly: true,
      //   secure: true, // use only if your site is served over HTTPS
      //   sameSite: 'strict'
      // };
      return res.status(200).cookie("token", token).json({ success: true, user });
    }
    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
