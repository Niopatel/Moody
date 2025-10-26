import { Injectable, signal } from '@angular/core';

// In a real build process (like with Vite, Webpack, or Next.js),
// `process.env.NEXT_PUBLIC_GEMINI_API_KEY` would be replaced with the actual key string.
declare const process: any;

// Use a variable to hold the key from the environment.
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  // Initialize the signal with the key from the environment variable.
  apiKey = signal<string | null>(GEMINI_KEY || null);

  constructor() {
    // If the key is not found, display an alert to the user.
    if (!this.apiKey()) {
      alert('❌ Gemini API key not found in environment. Please add NEXT_PUBLIC_GEMINI_API_KEY in Vercel settings.');
    }
  }
}
