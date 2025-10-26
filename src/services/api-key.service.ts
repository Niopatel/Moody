import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  apiKey = signal<string | null>(null);
  private storageKey = 'moody_gemini_api_key';
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const storedKey = localStorage.getItem(this.storageKey);
      this.apiKey.set(storedKey);
    }
  }

  saveApiKey(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, key);
      this.apiKey.set(key);
    }
  }

  removeApiKey(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKey);
      this.apiKey.set(null);
    }
  }
}
