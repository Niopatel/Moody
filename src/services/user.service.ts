import { Injectable, signal, inject } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { User } from '../models/moody.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private ls = inject(LocalStorageService);
  
  currentUser = signal<User | null>(this.ls.getItem<User | null>('moody_currentUser', null));
  
  register(name: string, email: string, gender: 'male' | 'female' | 'other', age: number, heightCm: number, password: string): User {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      gender,
      age,
      heightCm,
      password,
      createdAt: new Date().toISOString()
    };
    this.ls.setItem('moody_currentUser', newUser);
    this.currentUser.set(newUser);
    return newUser;
  }
  
  logout(): void {
    this.ls.removeItem('moody_currentUser');
    this.currentUser.set(null);
  }
  
  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}