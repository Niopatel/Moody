import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { UserService } from '../../services/user.service';
import { Habit } from '../../models/moody.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <style>
      .mood-button { background-color: #374151; }
      .mood-button.selected-mood {
        background-color: var(--mood-color);
        box-shadow: 0 0 20px var(--mood-color), 0 0 5px var(--mood-color) inset;
        transform: scale(1.1);
      }
    </style>
    <div class="space-y-8">
      <header>
        <h1 class="text-2xl sm:text-3xl font-bold text-white">
          Welcome back, {{ userName() }}!
        </h1>
        <p class="text-gray-400">{{ currentDate | date:'EEEE, MMMM d' }}</p>
         <p class="text-sm text-[#00E0B8] flex items-center gap-2 mt-1">
          <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E0B8] opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-[#00E0B8]"></span></span>
          System Synced & Ready
        </p>
      </header>
      
      <!-- Mood Logger -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-gray-200">How are you feeling today?</h2>
        <div class="flex justify-around items-center space-x-2 sm:space-x-4">
          @for (mood of moods; track mood.rating) {
            <button (click)="selectMood(mood.rating)" 
                    [class.selected-mood]="selectedMoodRating() === mood.rating"
                    [style.--mood-color]="mood.color"
                    class="mood-button w-12 h-12 rounded-full text-2xl transition-all duration-200 transform hover:scale-110 focus:outline-none">
              {{ mood.icon }}
            </button>
          }
        </div>
      </div>
       @if (selectedMoodRating()) {
        <div class="mt-4">
          <textarea [(ngModel)]="moodNote"
                    placeholder="Add a note about your mood (optional)..."
                    class="w-full p-2 border rounded-md bg-[#0b0b12] border-gray-600 text-white focus:ring-[#7C5CFF] focus:border-[#7C5CFF]">
          </textarea>
          <button (click)="saveMood()" class="mt-2 w-full px-4 py-2 bg-[#7C5CFF] text-white rounded-md hover:bg-[#6a48ff] disabled:bg-violet-500/30">
            {{ todaysMood() ? 'Update' : 'Save' }} Mood
          </button>
        </div>
      }
      
      <!-- Habit Tracker -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">Today's Directives</h2>
        @if (habits().length > 0) {
          <div class="space-y-5">
            @for (habit of habits(); track habit.id) {
              <div class="flex flex-col">
                <div class="flex justify-between items-baseline mb-1">
                  <span class="font-medium text-gray-300">{{ habit.title }}</span>
                  <span class="text-sm text-gray-400">
                    @if(habit.target > 1) {
                      {{ getHabitValue(habit.id) }} / {{ habit.target }} {{ habit.unit }}
                    } @else {
                      {{ getHabitValue(habit.id) > 0 ? 'Complete' : 'Pending' }}
                    }
                  </span>
                </div>
                <div class="flex items-center gap-4">
                  <!-- Progress Bar -->
                  <div class="w-full bg-[#0b0b12] rounded-full h-2.5">
                    <div class="bg-gradient-to-r from-[#7C5CFF] to-[#00E0B8] h-2.5 rounded-full" [style.width.%]="getHabitProgress(habit)"></div>
                  </div>
                  <!-- Controls -->
                  @if(habit.target > 1) {
                    <div class="flex items-center gap-2">
                      <button (click)="decrementHabit(habit.id)" class="w-8 h-8 rounded-full bg-[#0b0b12] border border-gray-600 text-gray-300 hover:bg-[#7C5CFF]/20">-</button>
                      <button (click)="incrementHabit(habit.id)" class="w-8 h-8 rounded-full bg-[#0b0b12] border border-gray-600 text-gray-300 hover:bg-[#7C5CFF]/20">+</button>
                    </div>
                  } @else {
                    <button (click)="toggleHabit(habit.id)" 
                            class="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
                            [class.bg-[#00E0B8]/80]="getHabitValue(habit.id) > 0"
                            [class.text-black]="getHabitValue(habit.id) > 0"
                            [class.hover:bg-[#00E0B8]]="getHabitValue(habit.id) > 0"
                            [class.bg-[#0b0b12]]="getHabitValue(habit.id) === 0"
                            [class.text-gray-300]="getHabitValue(habit.id) === 0"
                            [class.border]="getHabitValue(habit.id) === 0"
                            [class.border-gray-600]="getHabitValue(habit.id) === 0"
                            [class.hover:bg-[#7C5CFF]/20]="getHabitValue(habit.id) === 0"
                            >
                      {{ getHabitValue(habit.id) > 0 ? 'Done' : 'Mark Done' }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-6">
             <p class="text-gray-400">You haven't set up any habits yet.</p>
             <a routerLink="/settings" class="mt-2 inline-block px-4 py-2 bg-[#7C5CFF]/20 text-[#7C5CFF] rounded-md hover:bg-[#7C5CFF]/30">
                Go to Settings to add one
             </a>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a routerLink="/ai-calorie" class="group flex items-center p-4 bg-[#0b0b12] rounded-lg border border-transparent hover:border-[#00E0B8]/50 transition-all duration-300 transform hover:-translate-y-1">
            <i class="fas fa-utensils text-xl text-[#00E0B8] w-8 text-center group-hover:animate-pulse"></i>
            <span class="ml-3 text-gray-300 group-hover:text-white">Log Food</span>
          </a>
          <a routerLink="/weight-ai" class="group flex items-center p-4 bg-[#0b0b12] rounded-lg border border-transparent hover:border-[#00E0B8]/50 transition-all duration-300 transform hover:-translate-y-1">
            <i class="fas fa-weight-scale text-xl text-[#00E0B8] w-8 text-center group-hover:animate-pulse"></i>
            <span class="ml-3 text-gray-300 group-hover:text-white">Log Weight</span>
          </a>
          <a routerLink="/ai-diet-coach" class="group flex items-center p-4 bg-[#0b0b12] rounded-lg border border-transparent hover:border-[#7C5CFF]/50 transition-all duration-300 transform hover:-translate-y-1">
            <i class="fas fa-utensils text-xl text-[#7C5CFF] w-8 text-center group-hover:animate-pulse"></i>
            <span class="ml-3 text-gray-300 group-hover:text-white">AI Diet + Workout Coach</span>
          </a>
          <a routerLink="/meditation" class="group flex items-center p-4 bg-[#0b0b12] rounded-lg border border-transparent hover:border-[#00E0B8]/50 transition-all duration-300 transform hover:-translate-y-1">
            <i class="fas fa-spa text-xl text-[#00E0B8] w-8 text-center group-hover:animate-pulse"></i>
            <span class="ml-3 text-gray-300 group-hover:text-white">Meditation Timer</span>
          </a>
          <a routerLink="/ai-coach" class="group flex items-center p-4 bg-[#0b0b12] rounded-lg border border-transparent hover:border-[#7C5CFF]/50 transition-all duration-300 transform hover:-translate-y-1">
            <i class="fas fa-brain text-xl text-[#7C5CFF] w-8 text-center group-hover:animate-pulse"></i>
            <span class="ml-3 text-gray-300 group-hover:text-white">AI Wellness Coach</span>
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  dataService = inject(DataService);
  userService = inject(UserService);

  currentDate = new Date();
  userName = computed(() => this.userService.currentUser()?.name?.split(' ')[0] || 'User');
  todaysMood = this.dataService.getTodaysMood;
  habits = this.dataService.habits;
  habitLogs = this.dataService.habitLogs;

  selectedMoodRating = signal<number | null>(this.todaysMood()?.rating ?? null);
  moodNote = signal(this.todaysMood()?.note ?? '');
  
  moods = [
    { rating: 1, icon: '😠', color: '#ef4444' },
    { rating: 2, icon: '🙁', color: '#f97316' },
    { rating: 3, icon: '😐', color: '#eab308' },
    { rating: 4, icon: '🙂', color: '#22c55e' },
    { rating: 5, icon: '😁', color: '#14b8a6' },
  ];

  selectMood(rating: number) {
    this.selectedMoodRating.set(rating);
  }

  saveMood() {
    if (this.selectedMoodRating() !== null) {
      this.dataService.addOrUpdateMoodLog(this.selectedMoodRating()!, this.moodNote());
    }
  }
  
  getHabitValue(habitId: string): number {
    return this.dataService.getTodaysHabitLog(habitId)?.value ?? 0;
  }

  incrementHabit(habitId: string): void {
    const currentValue = this.getHabitValue(habitId);
    const habit = this.habits().find(h => h.id === habitId);
    if (habit && currentValue < habit.target) {
        this.dataService.logHabit(habitId, currentValue + 1);
    }
  }

  decrementHabit(habitId: string): void {
      const currentValue = this.getHabitValue(habitId);
      if (currentValue > 0) {
          this.dataService.logHabit(habitId, currentValue - 1);
      }
  }

  toggleHabit(habitId: string): void {
      const currentValue = this.getHabitValue(habitId);
      const newValue = currentValue === 0 ? 1 : 0;
      this.dataService.logHabit(habitId, newValue);
  }

  getHabitProgress(habit: Habit): number {
      const value = this.getHabitValue(habit.id);
      if (habit.target === 0) return 0;
      return (value / habit.target) * 100;
  }
}
