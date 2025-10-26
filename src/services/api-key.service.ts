import { Injectable, signal, inject } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private ls = inject(LocalStorageService);
  apiKey = signal<string | null>(this.ls.getItem<string | null>('gemini_api_key', null));

  setApiKey(key: string): void {
    this.apiKey.set(key);
    this.ls.setItem('gemini_api_key', key);
  }

  removeApiKey(): void {
    this.apiKey.set(null);
    this.ls.removeItem('gemini_api_key');
  }
}
