// FIX: Implemented TranslationService using Google GenAI API.
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

declare const process: any;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        console.warn('Gemini API key not found. Translation service will be disabled.');
      }
    } catch (error) {
      console.error("Failed to initialize Gemini AI for translation:", error);
      this.ai = null;
    }
  }

  hasApiKey(): boolean {
    return !!this.ai;
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