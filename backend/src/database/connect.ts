import mongoose from 'mongoose';
import config from '../config/default';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.DB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};