// FIX: Implemented GeminiService to handle all Google GenAI API interactions.
import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { from, Observable, of, Subscriber } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiKeyService } from './api-key.service';

export interface CalorieEstimate {
  estCalories: number;
  estProtein: number;
  estCarbs: number;
  estFat: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface AnalysisReport {
    summary: string;
    brainRegions: string;
    herbalRecommendations: string;
    advice: string;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
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
          console.error("Failed to initialize Gemini AI:", error);
          this.ai = null;
          this.apiKeyPresent.set(false);
        }
      } else {
        console.warn('Gemini API key not found. AI features will be disabled.');
        this.ai = null;
        this.apiKeyPresent.set(false);
      }
    });
  }

  hasApiKey(): boolean {
    return this.apiKeyPresent();
  }
  
  generateQuizQuestions(topic: string, language: string): Observable<QuizQuestion[] | { error: string }> {
    if (!this.ai) return of({ error: 'AI service not initialized.' });

    const prompt = `Generate a 5-question multiple-choice quiz in ${language} about self-assessing symptoms related to ${topic}. Each question should be empathetic and easy to understand. Each question must have exactly 4 answer options ranging from low to high severity (e.g., 'Not at all', 'Sometimes', 'Often', 'Almost Always'). Respond ONLY with a JSON array of objects.`;

    const promise = this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['question', 'options']
          }
        }
      }
    });

    return from(promise).pipe(
      // FIX: Add explicit type for the response object to resolve property access error.
      map((response: GenerateContentResponse) => JSON.parse(response.text) as QuizQuestion[]),
      catchError(err => {
        console.error('Error generating quiz:', err);
        return of({ error: 'Failed to generate quiz questions.' });
      })
    );
  }

  getAnalysisReport(topic: string, language: string, answers: { question: string, answer: string }[]): Observable<AnalysisReport | { error: string }> {
    if (!this.ai) return of({ error: 'AI service not initialized.' });

    const answersString = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
    const prompt = `A user seeking wellness advice is concerned about ${topic}. They answered the following self-assessment quiz in ${language}:\n\n${answersString}\n\nBased ONLY on these answers, provide a supportive analysis. Respond ONLY with a JSON object. The analysis should contain:
1.  "summary": A brief, empathetic summary of the user's responses. IMPORTANT: Start this summary with a clear disclaimer in ${language} stating: "This is an AI-generated analysis and not a substitute for professional medical advice. Please consult a healthcare provider for any health concerns."
2.  "brainRegions": A markdown-formatted string listing 2-3 brain regions potentially associated with the user's feelings (e.g., Amygdala, Prefrontal Cortex) and a brief, simple explanation of their role.
3.  "herbalRecommendations": A markdown-formatted string listing 2-3 traditional Indian herbal recommendations (like Ashwagandha, Brahmi, Tulsi) that could support general well-being related to the topic, with a one-sentence description for each.
4.  "advice": A markdown-formatted string with 3-4 simple, non-medical, actionable steps the user can take (e.g., 'Practice deep breathing for 5 minutes daily', 'Try journaling your thoughts').`;
    
    const promise = this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    brainRegions: { type: Type.STRING },
                    herbalRecommendations: { type: Type.STRING },
                    advice: { type: Type.STRING },
                },
                required: ['summary', 'brainRegions', 'herbalRecommendations', 'advice']
            }
        }
    });

    return from(promise).pipe(
        // FIX: Add explicit type for the response object to resolve property access error.
        map((response: GenerateContentResponse) => JSON.parse(response.text) as AnalysisReport),
        catchError(err => {
            console.error('Error getting analysis report:', err);
            return of({ error: 'Failed to generate the analysis report.' });
        })
    );
  }

  getCalorieEstimate(foodText: string): Observable<CalorieEstimate | { error: string }> {
    if (!this.ai) {
      return of({ error: 'AI service not initialized.' });
    }

    const prompt = `Analyze the following meal description and provide an estimate for calories, protein, carbohydrates, and fat. The description is: "${foodText}". Respond only with a JSON object.`;
    
    const promise = this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estCalories: { type: Type.INTEGER, description: 'Estimated calories in kcal' },
            estProtein: { type: Type.INTEGER, description: 'Estimated protein in grams' },
            estCarbs: { type: Type.INTEGER, description: 'Estimated carbohydrates in grams' },
            estFat: { type: Type.INTEGER, description: 'Estimated fat in grams' },
          },
          required: ['estCalories', 'estProtein', 'estCarbs', 'estFat']
        }
      }
    });

    return from(promise).pipe(
      map((response: GenerateContentResponse) => {
        try {
          return JSON.parse(response.text) as CalorieEstimate;
        } catch (e) {
          console.error('Error parsing Gemini response:', e);
          return { error: 'Failed to parse AI response.' };
        }
      }),
      catchError(err => {
        console.error('Error from Gemini API:', err);
        return of({ error: 'AI analysis failed. Please try again.' });
      })
    );
  }

  getCalorieEstimateFromImage(prompt: string, imageBase64: string, mimeType: string): Observable<CalorieEstimate | { error: string }> {
    if (!this.ai) {
      return of({ error: 'AI service not initialized.' });
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    };

    const textPart = {
      text: `Analyze the meal in this image. The user added this description: "${prompt}". Provide an estimate for calories, protein, carbohydrates, and fat. Respond only with a JSON object.`
    };

    const promise = this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    estCalories: { type: Type.INTEGER, description: 'Estimated calories in kcal' },
                    estProtein: { type: Type.INTEGER, description: 'Estimated protein in grams' },
                    estCarbs: { type: Type.INTEGER, description: 'Estimated carbohydrates in grams' },
                    estFat: { type: Type.INTEGER, description: 'Estimated fat in grams' },
                },
                required: ['estCalories', 'estProtein', 'estCarbs', 'estFat']
            }
        }
    });

    return from(promise).pipe(
        map((response: GenerateContentResponse) => {
            try {
                return JSON.parse(response.text) as CalorieEstimate;
            } catch (e) {
                console.error('Error parsing Gemini image response:', e);
                return { error: 'Failed to parse AI response.' };
            }
        }),
        catchError(err => {
            console.error('Error from Gemini API (image):', err);
            return of({ error: 'AI image analysis failed. Please try again.' });
        })
    );
  }

  getGeneralAnalysis(prompt: string): Observable<string> {
    if (!this.ai) {
      return of('AI service not initialized.');
    }

    const streamPromise = this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: 'You are MOODY AI, a friendly and supportive AI wellness coach. Your goal is to help the user understand their patterns and feel better. Be empathetic, encouraging, and provide actionable, simple advice. Do not be overly verbose. You are a helpful psychiatrist and wellness coach. Always include a disclaimer that you are an AI and not a replacement for a medical professional for serious issues. Format your response with markdown.'
        }
    });

    return new Observable((subscriber: Subscriber<string>) => {
        const processStream = async () => {
            try {
                for await (const chunk of await streamPromise) {
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

  generateDietPlanStream(prompt: string): Observable<string> {
    if (!this.ai) {
      return of('AI service not initialized.');
    }

    const streamPromise = this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return new Observable((subscriber: Subscriber<string>) => {
        const processStream = async () => {
            try {
                for await (const chunk of await streamPromise) {
                    subscriber.next(chunk.text);
                }
                subscriber.complete();
            } catch (err) {
                console.error('Error processing stream from Gemini (Diet Plan):', err);
                subscriber.error('Sorry, I had trouble generating a diet plan.');
            }
        };
        processStream();
    });
  }
}