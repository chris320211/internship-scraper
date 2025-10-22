import bcrypt from 'bcrypt';
import pool from './database.js';

const SALT_ROUNDS = 10;

export async function signup(email, password) {
  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in signup:', error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    // Get user by email
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Return user without password hash
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Error in login:', error);
    throw error;
  }
}

export async function createUserProfile(userId, collegeYear, careerInterests) {
  try {
    const result = await pool.query(
      'INSERT INTO user_profiles (user_id, college_year, career_interests) VALUES ($1, $2, $3) RETURNING *',
      [userId, collegeYear, careerInterests]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId, collegeYear, careerInterests) {
  try {
    const result = await pool.query(
      `UPDATE user_profiles
       SET college_year = $2, career_interests = $3, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, collegeYear, careerInterests]
    );

    if (result.rows.length === 0) {
      // Profile doesn't exist, create it
      return await createUserProfile(userId, collegeYear, careerInterests);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}
