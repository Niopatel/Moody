import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// This will be populated by Vercel's build process from environment variables.
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  apiKey = signal<string | null>(null);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (GEMINI_KEY) {
      this.apiKey.set(GEMINI_KEY);
    } else {
      this.apiKey.set(null);
      if (isPlatformBrowser(this.platformId)) {
        // Only show alert in the browser
        alert('❌ Gemini API key not found in environment. Please add NEXT_PUBLIC_GEMINI_API_KEY in Vercel settings.');
      }
      console.error('Gemini API key not found. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
    }
  }
}
