import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DataService } from '../../services/data.service';
import { Habit } from '../../models/moody.model';
import { ApiKeyService } from '../../services/api-key.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 class="text-3xl font-bold text-white">Settings</h1>
        <p class="text-gray-400">Manage your profile, habits, and data.</p>
      </header>

      <!-- User Profile Section -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">User Profile</h2>
        @if (user()) {
          <div class="space-y-2 text-gray-300">
            <p><span class="font-medium text-gray-400">Name:</span> {{ user()?.name }}</p>
            <p><span class="font-medium text-gray-400">Email:</span> {{ user()?.email }}</p>
            <p><span class="font-medium text-gray-400">Age:</span> {{ user()?.age }}</p>
            <p><span class="font-medium text-gray-400">Height:</span> {{ user()?.heightCm }} cm</p>
            <p><span class="font-medium text-gray-400">Gender:</span> <span class="capitalize">{{ user()?.gender }}</span></p>
          </div>
        }
      </div>

      <!-- Habit Management -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">Manage Habits</h2>
        <div class="space-y-4 mb-6">
          @for(habit of habits(); track habit.id) {
            <div class="flex justify-between items-center p-3 bg-[#0b0b12] rounded-md">
              <span class="text-gray-300">{{ habit.title }} (Goal: {{ habit.target }} {{ habit.unit }})</span>
              <button (click)="deleteHabit(habit.id)" class="text-red-400 hover:text-red-500">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          }
          @if(habits().length === 0) {
            <p class="text-gray-500">No habits defined yet.</p>
          }
        </div>
        <form (ngSubmit)="addHabit()" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="md:col-span-2">
            <label for="habitTitle" class="block text-sm font-medium text-gray-300">Habit Title</label>
            <input id="habitTitle" type="text" [(ngModel)]="newHabit.title" name="habitTitle" required class="mt-1 block w-full p-2 border rounded-md bg-[#0b0b12] border-gray-600 text-white focus:ring-[#7C5CFF] focus:border-[#7C5CFF]">
          </div>
          <div>
            <label for="habitTarget" class="block text-sm font-medium text-gray-300">Daily Target</label>
            <input id="habitTarget" type="number" [(ngModel)]="newHabit.target" name="habitTarget" required min="1" class="mt-1 block w-full p-2 border rounded-md bg-[#0b0b12] border-gray-600 text-white focus:ring-[#7C5CFF] focus:border-[#7C5CFF]">
          </div>
          <div>
            <button type="submit" [disabled]="!newHabit.title || !newHabit.target" class="w-full px-4 py-2 bg-[#7C5CFF] text-white rounded-md hover:bg-[#6a48ff] disabled:bg-violet-500/30">Add Habit</button>
          </div>
        </form>
      </div>

      <!-- API Key Management -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">Gemini API Key</h2>
        @if (apiKey()) {
          <div class="flex items-center justify-between p-3 bg-[#0b0b12] rounded-md">
            <span class="text-green-400 font-mono text-sm">API Key is set. AI features are active.</span>
            <button (click)="removeApiKey()" class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Remove Key</button>
          </div>
        } @else {
          <p class="text-amber-400 text-sm mb-4">Please enter your Google Gemini API key to enable AI-powered features like calorie estimation and the wellness coach.</p>
          <div class="flex space-x-2">
            <input [type]="showApiKey() ? 'text' : 'password'"
                  [(ngModel)]="apiKeyInput"
                  placeholder="Enter your Gemini API Key"
                  class="flex-grow bg-[#0b0b12] border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]">
            <button (click)="showApiKey.set(!showApiKey())" class="px-3 bg-[#0b0b12] border border-gray-600 rounded-md text-gray-400 hover:text-white">
              <i class="fas" [class.fa-eye-slash]="showApiKey()" [class.fa-eye]="!showApiKey()"></i>
            </button>
            <button (click)="saveApiKey()" [disabled]="!apiKeyInput()" class="bg-[#7C5CFF] text-white px-5 rounded-md font-semibold hover:bg-[#6a48ff] disabled:bg-gray-600">
              Save
            </button>
          </div>
        }
      </div>

      <!-- Data Management -->
      <div class="p-6 bg-[#131321] rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4 text-gray-200">Data Management</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button (click)="exportData()" class="px-4 py-2 bg-green-600/80 text-white rounded-md hover:bg-green-600">Export My Data</button>
          <div>
            <label for="import-file" class="w-full text-center cursor-pointer px-4 py-2 bg-blue-600/80 text-white rounded-md hover:bg-blue-600 block">Import Data</label>
            <input id="import-file" type="file" (change)="importData($event)" class="hidden" accept=".json">
          </div>
        </div>
        @if (importStatus()) {
          <p class="mt-4 text-sm" [class.text-green-400]="importStatus()?.success" [class.text-red-400]="!importStatus()?.success">
            {{ importStatus()?.message }}
          </p>
        }
      </div>
      
      <!-- Danger Zone -->
      <div class="p-6 bg-red-900/50 border border-red-500/50 rounded-lg">
        <h2 class="text-xl font-semibold text-red-300">Danger Zone</h2>
        <p class="text-red-400 mt-2 mb-4">These actions are irreversible. Please proceed with caution.</p>
        <button (click)="deleteAllData()" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete All My Data</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  userService = inject(UserService);
  dataService = inject(DataService);
  router = inject(Router);
  apiKeyService = inject(ApiKeyService);

  user = this.userService.currentUser;
  habits = this.dataService.habits;
  importStatus = signal<{ success: boolean; message: string } | null>(null);

  apiKey = this.apiKeyService.apiKey;
  apiKeyInput = signal('');
  showApiKey = signal(false);

  newHabit = { title: '', target: 1, unit: 'times' }; // unit is fixed for now for simplicity

  saveApiKey(): void {
    if (this.apiKeyInput().trim()) {
      this.apiKeyService.setApiKey(this.apiKeyInput().trim());
      this.apiKeyInput.set('');
    }
  }

  removeApiKey(): void {
    this.apiKeyService.removeApiKey();
  }

  addHabit() {
    if (this.newHabit.title.trim() && this.newHabit.target > 0) {
      this.dataService.addHabit(this.newHabit.title, this.newHabit.target, this.newHabit.unit);
      this.newHabit = { title: '', target: 1, unit: 'times' };
    }
  }

  deleteHabit(id: string) {
    if (confirm('Are you sure you want to delete this habit and all its logged data?')) {
      this.dataService.deleteHabit(id);
    }
  }
  
  exportData() {
    const dataStr = this.dataService.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moody_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = this.dataService.importData(e.target?.result as string);
      this.importStatus.set(result);
    };
    reader.readAsText(file);
    // Reset file input
    (event.target as HTMLInputElement).value = '';
  }

  deleteAllData() {
    if (confirm('ARE YOU ABSOLUTELY SURE? This will delete all your moods, food logs, weight entries, and habits forever.')) {
        if (confirm('This action cannot be undone. Please confirm one more time.')) {
            this.dataService.clearAllData();
            alert('All your data has been deleted.');
        }
    }
  }
}
