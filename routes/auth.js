const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const db = require('../db');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_APISEC
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  
  jwt.verify(token, process.env.SECRET_KEY || 'fallback-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};


// ================= REGISTER =================
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    console.log("Incoming Registration:", req.body);

    const { username, firstName, middleName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!username || !firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    // Check username exists
    const [existingUsers] = await db.query(
      'SELECT username FROM users WHERE username = ?', 
      [username]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username already exists. Please choose a different username." });
    }

    // Check email exists
    const [existingEmails] = await db.query(
      'SELECT email FROM users WHERE email = ?', 
      [email]
    );
    if (existingEmails.length > 0) {
      return res.status(400).json({ error: "Email already registered. Please use a different email." });
    }

    // Ensure file exists
    if (!req.file) {
      return res.status(400).json({ error: "Profile image is required" });
    }

    // Hash password
    const hashed_pass = await bcrypt.hash(password, 10);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `User Dashboard/${username}`,
          public_id: 'profile_pic',
          resource_type: 'image',
          overwrite: true
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const picUrl = uploadResult.secure_url;
    console.log('Uploaded Profile URL:', picUrl);

    // Insert user into DB
    const insertSql = `
      INSERT INTO users 
      (username, email, password, first_name, middle_name, last_name, phone, profile_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await db.query(insertSql, [
      username,
      email,
      hashed_pass,
      firstName,
      middleName || null,
      lastName,
      phone,
      picUrl
    ]);

    return res.status(201).json({
      ok: true,
      message: "Registration successful",
      username,
      userId: insertResult.insertId
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});



// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials.' });

    // Remove password before sending response
    const { password: _, ...userSafe } = user;

    // Create JWT token with 12 hours expiration
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      process.env.SECRET_KEY || 'fallback-secret-key',
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: 'Login successful.',
      user: userSafe,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// ================= PROFILE =================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get user profile from database using req.user.id from middleware
    const [users] = await db.query(
      'SELECT id, username, email, first_name, middle_name, last_name, phone, profile_image FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Construct full name
    if (user.middle_name) {
      user.full_name = `${user.first_name} ${user.middle_name} ${user.last_name}`;
    } else {
      user.full_name = `${user.first_name} ${user.last_name}`;
    }

    // Remove sensitive data if any
    delete user.password;

    return res.json(user);

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
