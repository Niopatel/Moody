// FIX: Add all necessary model interfaces for the application.
export interface User {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  password?: string;
  createdAt: string;
}

export interface MoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
  note?: string;
}

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  estCalories?: number;
  estProtein?: number;
  estCarbs?: number;
  estFat?: number;
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface Habit {
  id: string;
  title: string;
  target: number;
  unit: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}