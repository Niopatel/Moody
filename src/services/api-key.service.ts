import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'gemini_api_key';

  apiKey = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.apiKey.set(localStorage.getItem(this.storageKey));
    }
  }

  saveKey(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, key);
      this.apiKey.set(key);
    }
  }

  removeKey(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKey);
      this.apiKey.set(null);
    }
  }
}
