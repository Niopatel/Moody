import { Injectable, signal } from '@angular/core';

// IMPORTANT: REPLACE "YOUR_GEMINI_API_KEY_HERE" with your actual Gemini API key.
// This key will be embedded in the application, making it accessible to anyone who uses the deployed app.
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  apiKey = signal<string | null>(null);

  constructor() {
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.apiKey.set(GEMINI_API_KEY);
    } else {
      console.error("API Key not provided in src/services/api-key.service.ts. Please add your key.");
      this.apiKey.set(null);
    }
  }
}
