import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// This is a placeholder for the build-time environment variable.
// In a Vercel/Next.js environment, the build process replaces this with the actual key.
declare const process: any;

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private platformId = inject(PLATFORM_ID);
  
  // Initialize the signal from the environment variable.
  apiKey = signal<string | null>(null);

  constructor() {
    // Only run this logic in the browser environment.
    if (isPlatformBrowser(this.platformId)) {
        try {
            // Access the environment variable provided at build time.
            const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (envKey && envKey.trim() !== '') {
                this.apiKey.set(envKey);
            } else {
                // If the key is missing or empty, handle it.
                this.handleMissingKey();
            }
        } catch (e) {
            // This catch block handles cases where `process` or `process.env` is not defined.
            this.handleMissingKey();
        }
    }
  }

  private handleMissingKey(): void {
    this.apiKey.set(null);
    console.warn('Gemini API key not found in environment.');
    // Alert the user as requested for hackathon setup.
    alert('❌ Gemini API key not found in environment. Please add NEXT_PUBLIC_GEMINI_API_KEY in Vercel settings.');
  }
}
