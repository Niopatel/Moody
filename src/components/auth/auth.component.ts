import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0b0b12] p-4">
      <div class="w-full max-w-md p-8 space-y-6 bg-[#131321] rounded-2xl shadow-2xl shadow-[#7C5CFF]/20">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-center text-[#7C5CFF]">Welcome to MOODY AI</h1>
          <p class="mt-2 text-center text-sm text-gray-400">
            Your personal wellness companion. Let's get you set up.
          </p>
        </div>
        <form class="mt-8 space-y-4" (ngSubmit)="register()">
          <div class="space-y-4">
            <input id="name" name="name" type="text" [(ngModel)]="name" required
                   class="relative block w-full px-3 py-3 bg-[#0b0b12] border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] sm:text-sm"
                   placeholder="Your Name">
            
            <input id="email-address" name="email" type="email" autocomplete="email" [(ngModel)]="email" required
                   class="relative block w-full px-3 py-3 bg-[#0b0b12] border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] sm:text-sm"
                   placeholder="Email address">

            <div class="grid grid-cols-2 gap-4">
               <input id="age" name="age" type="number" [(ngModel)]="age" required
                     class="relative block w-full px-3 py-3 bg-[#0b0b12] border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] sm:text-sm"
                     placeholder="Age">
               <input id="height" name="height" type="number" [(ngModel)]="height" required
                     class="relative block w-full px-3 py-3 bg-[#0b0b12] border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] sm:text-sm"
                     placeholder="Height (cm)">
            </div>

             <input id="password" name="password" type="password" [(ngModel)]="password" required
                   class="relative block w-full px-3 py-3 bg-[#0b0b12] border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:border-[#7C5CFF] sm:text-sm"
                   placeholder="Password">
            <p class="text-xs text-gray-500 px-1">Note: For demonstration purposes, your password is saved locally and is not securely hashed.</p>
          </div>
    
          <div>
            <label class="block text-sm font-medium text-gray-300">Gender</label>
            <div class="mt-2 flex items-center space-x-4">
              <label class="inline-flex items-center">
                <input type="radio" name="gender" value="male" [(ngModel)]="gender" class="text-[#7C5CFF] bg-gray-700 border-gray-600 focus:ring-[#7C5CFF]">
                <span class="ml-2 text-gray-300">Male</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" name="gender" value="female" [(ngModel)]="gender" class="text-[#7C5CFF] bg-gray-700 border-gray-600 focus:ring-[#7C5CFF]">
                <span class="ml-2 text-gray-300">Female</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" name="gender" value="other" [(ngModel)]="gender" class="text-[#7C5CFF] bg-gray-700 border-gray-600 focus:ring-[#7C5CFF]">
                <span class="ml-2 text-gray-300">Other</span>
              </label>
            </div>
          </div>
    
          <div class="pt-2">
            <button type="submit" [disabled]="!name().trim() || !email().trim() || !age() || !height() || !password().trim()"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#7C5CFF] hover:bg-[#6a48ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C5CFF] focus:ring-offset-[#131321] disabled:bg-violet-500/30 disabled:cursor-not-allowed transition-all duration-300 ease-in-out">
              Get Started
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  userService = inject(UserService);
  dataService = inject(DataService);
  // FIX: Explicitly type `router` to avoid type inference issues.
  router: Router = inject(Router);

  name = signal('');
  email = signal('');
  gender = signal<'male' | 'female' | 'other'>('other');
  age = signal<number | null>(null);
  height = signal<number | null>(null);
  password = signal('');

  register() {
    if (this.name().trim() && this.email().trim() && this.age() && this.height() && this.password()) {
      this.userService.register(this.name(), this.email(), this.gender(), this.age()!, this.height()!, this.password());
      this.addDefaultHabits();
      this.router.navigate(['/home']);
    }
  }

  private addDefaultHabits(): void {
    this.dataService.addHabit('Drink 8 glasses of water', 8, 'glasses');
    this.dataService.addHabit('Run for 30 minutes', 30, 'minutes');
    this.dataService.addHabit('Journal your thoughts', 1, 'time');
    this.dataService.addHabit('No screens 1 hour before bed', 1, 'time');
    this.dataService.addHabit('Read for 15 minutes', 15, 'minutes');
  }
}