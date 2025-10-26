// FIX: Implemented TranslationService using Google GenAI API.
import { Injectable, inject, effect, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiKeyService } from './api-key.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private apiKeyService = inject(ApiKeyService);
  private ai: GoogleGenAI | null = null;
  private apiKeyPresent = signal(false);

  constructor() {
    effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        try {
          this.ai = new GoogleGenAI({ apiKey });
          this.apiKeyPresent.set(true);
        } catch (error) {
          console.error("Failed to initialize Gemini AI for translation:", error);
          this.ai = null;
          this.apiKeyPresent.set(false);
        }
      } else {
        this.ai = null;
        this.apiKeyPresent.set(false);
      }
    });
  }

  hasApiKey(): boolean {
    return this.apiKeyPresent();
  }

  // FIX: Added currentLang() method which is needed by ai-analysis.component.
  currentLang(): string {
    // For simplicity in this fix, hardcoding to English.
    // A real application would get this from user settings or browser locale.
    return 'en';
  }

  translate(text: string, targetLanguage: string): Observable<string> {
    if (!this.ai) {
      return of('Translation service not available.');
    }

    const prompt = `Translate the following text to ${targetLanguage}: "${text}". Respond only with the translated text.`;

    const promise = this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return from(promise).pipe(
      // FIX: Add explicit type for the response object to resolve property access error.
      map((response: GenerateContentResponse) => response.text.trim()),
      catchError(err => {
        console.error('Error from Gemini translation API:', err);
        return of(`Translation failed: ${err.message}`);
      })
    );
  }
}