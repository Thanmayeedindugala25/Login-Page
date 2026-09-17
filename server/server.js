import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from './supabaseClient.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper for email regex validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 1. REGISTER ROUTE
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Check duplicate email in Supabase users table
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (findError) {
      console.error('Supabase query error:', findError);
      return res.status(500).json({ message: 'Database query error during verification.' });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered. Please login.' });
    }

    // Hash password with bcrypt salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into Supabase users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name: cleanName, email: cleanEmail, password: hashedPassword }]);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ message: 'Failed to create user account.' });
    }

    return res.status(201).json({ message: 'Account created successfully. Please login.' });
  } catch (err) {
    console.error('Registration server error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (findError) {
      console.error('Supabase query error:', findError);
      return res.status(500).json({ message: 'Database error during login.' });
    }

    if (!user) {
      return res.status(400).json({ message: "You're not registered yet. Please create an account first." });
    }

    // Compare bcrypt password hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    // Generate JWT token with minimum user info
    const payload = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login server error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. ME ROUTE (PROTECTED)
app.get('/api/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// 4. USERS LIST ROUTE (PROTECTED)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Select ONLY id, name, email (NEVER password)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase fetch users error:', error);
      return res.status(500).json({ message: 'Failed to retrieve users.' });
    }

    return res.status(200).json({ users: users || [] });
  } catch (err) {
    console.error('Get users server error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
