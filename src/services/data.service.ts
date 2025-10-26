import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { toDateString } from '../utils/date-helpers';
import { MoodLog, FoodLog, WeightLog, Habit, HabitLog } from '../models/moody.model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private ls = inject(LocalStorageService);
  private userService = inject(UserService);

  private userId = computed(() => this.userService.currentUser()?.id);

  // --- Signals for raw data ---
  moodLogs = signal<MoodLog[]>([]);
  foodLogs = signal<FoodLog[]>([]);
  weightLogs = signal<WeightLog[]>([]);
  habits = signal<Habit[]>([]);
  habitLogs = signal<HabitLog[]>([]);

  constructor() {
    // Effect to load and save data when user changes
    effect(() => {
      const currentUserId = this.userId();
      if (currentUserId) {
        this.moodLogs.set(this.ls.getItem(`moody_moodLogs_${currentUserId}`, []));
        this.foodLogs.set(this.ls.getItem(`moody_foodLogs_${currentUserId}`, []));
        this.weightLogs.set(this.ls.getItem(`moody_weightLogs_${currentUserId}`, []));
        this.habits.set(this.ls.getItem(`moody_habits_${currentUserId}`, []));
        this.habitLogs.set(this.ls.getItem(`moody_habitLogs_${currentUserId}`, []));
      } else {
        // Clear data if no user is logged in
        this.clearAllData(false); // Don't remove from LS, just clear signals
      }
    });
  }

  private save<T>(key: string, data: T): void {
    const currentUserId = this.userId();
    if (currentUserId) {
      this.ls.setItem(`moody_${key}_${currentUserId}`, data);
    }
  }

  // --- Computed signals for derived data ---
  getTodaysMood = computed(() => {
    const today = toDateString(new Date());
    return this.moodLogs().find(log => log.date === today);
  });

  getTodaysFoodLogs = computed(() => {
    const today = toDateString(new Date());
    return this.foodLogs().filter(log => log.date === today);
  });

  sortedWeightLogs = computed(() => {
    return [...this.weightLogs()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  // --- Public Methods to Modify State ---
  addOrUpdateMoodLog(rating: number, note?: string): void {
    const today = toDateString(new Date());
    this.moodLogs.update(logs => {
      const existingLogIndex = logs.findIndex(log => log.date === today);
      if (existingLogIndex > -1) {
        logs[existingLogIndex] = { ...logs[existingLogIndex], rating, note };
        return [...logs];
      }
      const newLog: MoodLog = { id: crypto.randomUUID(), date: today, rating, note };
      return [...logs, newLog];
    });
    this.save('moodLogs', this.moodLogs());
  }

  addFoodLog(log: Omit<FoodLog, 'id'>): void {
    const newLog: FoodLog = { ...log, id: crypto.randomUUID() };
    this.foodLogs.update(logs => [...logs, newLog]);
    this.save('foodLogs', this.foodLogs());
  }

  addWeightLog(weightKg: number): void {
    const today = toDateString(new Date());
    const newLog: WeightLog = { id: crypto.randomUUID(), date: today, weightKg };
    this.weightLogs.update(logs => {
        const filtered = logs.filter(l => l.date !== today);
        return [...filtered, newLog];
    });
    this.save('weightLogs', this.weightLogs());
  }

  addHabit(title: string, target: number, unit: string): void {
    const newHabit: Habit = { id: crypto.randomUUID(), title, target, unit };
    this.habits.update(habits => [...habits, newHabit]);
    this.save('habits', this.habits());
  }

  deleteHabit(id: string): void {
    this.habits.update(habits => habits.filter(h => h.id !== id));
    this.habitLogs.update(logs => logs.filter(l => l.habitId !== id));
    this.save('habits', this.habits());
    this.save('habitLogs', this.habitLogs());
  }

  logHabit(habitId: string, value: number): void {
    const today = toDateString(new Date());
    this.habitLogs.update(logs => {
      const existingLogIndex = logs.findIndex(log => log.date === today && log.habitId === habitId);
      if (existingLogIndex > -1) {
        logs[existingLogIndex] = { ...logs[existingLogIndex], value };
        return [...logs];
      }
      const newLog: HabitLog = { id: crypto.randomUUID(), habitId, date: today, value };
      return [...logs, newLog];
    });
    this.save('habitLogs', this.habitLogs());
  }
  
  getTodaysHabitLog(habitId: string): HabitLog | undefined {
    const today = toDateString(new Date());
    return this.habitLogs().find(log => log.date === today && log.habitId === habitId);
  }

  exportData(): string {
    const data = {
      moodLogs: this.moodLogs(),
      foodLogs: this.foodLogs(),
      weightLogs: this.weightLogs(),
      habits: this.habits(),
      habitLogs: this.habitLogs()
    };
    return JSON.stringify(data, null, 2);
  }
  
  importData(jsonString: string): { success: boolean, message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (data.moodLogs && data.foodLogs && data.weightLogs && data.habits && data.habitLogs) {
        this.moodLogs.set(data.moodLogs);
        this.foodLogs.set(data.foodLogs);
        this.weightLogs.set(data.weightLogs);
        this.habits.set(data.habits);
        this.habitLogs.set(data.habitLogs);
        
        this.save('moodLogs', this.moodLogs());
        this.save('foodLogs', this.foodLogs());
        this.save('weightLogs', this.weightLogs());
        this.save('habits', this.habits());
        this.save('habitLogs', this.habitLogs());
        
        return { success: true, message: 'Data imported successfully!' };
      } else {
        return { success: false, message: 'Invalid data format.' };
      }
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, message: 'Failed to parse the data file. Please check its format.' };
    }
  }

  clearAllData(removeFromStorage = true): void {
    const currentUserId = this.userId();
    if (removeFromStorage && currentUserId) {
        this.ls.removeItem(`moody_moodLogs_${currentUserId}`);
        this.ls.removeItem(`moody_foodLogs_${currentUserId}`);
        this.ls.removeItem(`moody_weightLogs_${currentUserId}`);
        this.ls.removeItem(`moody_habits_${currentUserId}`);
        this.ls.removeItem(`moody_habitLogs_${currentUserId}`);
    }
    this.moodLogs.set([]);
    this.foodLogs.set([]);
    this.weightLogs.set([]);
    this.habits.set([]);
    this.habitLogs.set([]);
  }
}