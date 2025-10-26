import { Injectable, inject } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { DataService } from './data.service';
import { UserService } from './user.service';
import { from, Observable, of, throwError, Subscriber } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { toDateString } from '../utils/date-helpers';
import { ChatMessage } from '../models/moody.model';

declare const process: any;

@Injectable({ providedIn: 'root' })
export class AiCoachService {
  private dataService = inject(DataService);
  private userService = inject(UserService);
  private ai: GoogleGenAI | null = null;
  private chat: Chat | null = null;

  constructor() {
    try {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        console.warn('Gemini API key not found in environment variables. AI Coach will be disabled.');
      }
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      this.ai = null;
    }
  }

  hasApiKey(): boolean {
    return !!this.ai;
  }
  
  private getSystemInstruction(): string {
    const today = toDateString(new Date());
    const user = this.userService.currentUser();
    const habits = this.dataService.habits();
    const todaysMood = this.dataService.getTodaysMood();
    const todaysFood = this.dataService.getTodaysFoodLogs();
    
    let context = `You are MOODY AI, a friendly and supportive AI wellness coach. Your goal is to help the user understand their patterns and feel better. Be empathetic, encouraging, and provide actionable, simple advice. The user's name is ${user?.name || 'there'}. Do not be overly verbose. Today is ${today}. You are a helpful psychiatrist and wellness coach. Always include a disclaimer that you are an AI and not a replacement for a medical professional for serious issues.`;
    
    if (habits.length > 0) {
      context += `\n\nHere are the user's current habits they are tracking:\n`;
      context += habits.map(h => `- ${h.title} (Goal: ${h.target} ${h.unit} per day)`).join('\n');
    }

    if (todaysMood) {
      context += `\n\nThe user's latest mood today was rated ${todaysMood.rating}/5. Note: "${todaysMood.note}".`;
    }

    if (todaysFood.length > 0) {
      const totalCalories = todaysFood.reduce((sum, log) => sum + (log.estCalories ?? 0), 0);
      context += `\n\nSo far today, the user has logged ${todaysFood.length} meals, with an estimated total of ${totalCalories} calories.`;
    }

    context += `\n\nBased on this context, provide helpful and concise responses.`;
    return context;
  }

  startChat(): ChatMessage[] {
    if (!this.ai) {
      return [{ role: 'model', text: 'AI Coach is disabled. Please configure your API key.' }];
    }
    
    const userName = this.userService.currentUser()?.name?.split(' ')[0] || 'there';

    this.chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: this.getSystemInstruction(),
      },
    });
    
    return [{ role: 'model', text: `Hi ${userName}! I'm MOODY AI, your personal wellness coach. How are you feeling today? You can type or tap the microphone to talk to me.` }];
  }

  sendMessage(message: string): Observable<string> {
    if (!this.chat) {
      return throwError(() => new Error('Chat not initialized.'));
    }
    
    const promise = this.chat.sendMessage({ message });

    return from(promise).pipe(
      map((response: GenerateContentResponse) => response.text),
      catchError(err => {
        console.error('Error sending message to Gemini:', err);
        return of('Sorry, I encountered an error. Please try again.');
      })
    );
  }

  sendMessageStream(message: string): Observable<string> {
    if (!this.chat) {
      return throwError(() => new Error('Chat not initialized.'));
    }

    const streamPromise = this.chat.sendMessageStream({ message });

    return new Observable((subscriber: Subscriber<string>) => {
      const processStream = async () => {
        try {
          for await (const chunk of await streamPromise) {
            // FIX: Access the 'text' property directly on the chunk.
            subscriber.next(chunk.text);
          }
          subscriber.complete();
        } catch (err) {
          console.error('Error processing stream from Gemini:', err);
          subscriber.error('Sorry, I had trouble generating a response.');
        }
      };
      processStream();
    });
  }
}