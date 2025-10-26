import { Injectable, signal, inject } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private ls = inject(LocalStorageService);
  
  // Initialize the signal from localStorage.
  apiKey = signal<string | null>(this.ls.getItem<string | null>(API_KEY_STORAGE_KEY, null));

  setApiKey(key: string): void {
    this.ls.setItem(API_KEY_STORAGE_KEY, key);
    this.apiKey.set(key);
  }

  removeApiKey(): void {
    this.ls.removeItem(API_KEY_STORAGE_KEY);
    this.apiKey.set(null);
  }
}
