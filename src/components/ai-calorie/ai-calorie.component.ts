import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';
import { toDateString } from '../../utils/date-helpers';
import { FoodLog } from '../../models/moody.model';

@Component({
  selector: 'app-ai-calorie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-3xl font-bold text-white">AI Calorie Log (Lite)</h1>
        <p class="text-gray-400">Quickly estimate calories for your meals.</p>
      </header>

      @if (!hasApiKey()) {
        <div class="bg-red-900/50 border border-red-500/50 rounded-lg p-4 text-center">
          <p class="text-red-300">AI features are disabled. Please configure the NEXT_PUBLIC_GEMINI_API_KEY in your Vercel project settings and redeploy.</p>
        </div>
      }

      <!-- Input Form -->
      <div class="bg-[#131321] p-4 rounded-lg">
        <div class="flex space-x-2">
          <input type="text"
                [(ngModel)]="foodInput"
                (keyup.enter)="logFood()"
                placeholder="e.g., 2 rotis + dal + salad"
                class="flex-grow bg-[#0b0b12] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                [disabled]="isLoading()">
          <button (click)="logFood()" [disabled]="isLoading() || foodInput().trim().length === 0"
                  class="bg-[#7C5CFF] text-white px-5 rounded-md font-semibold hover:bg-[#6a48ff] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            @if (isLoading()) {
              <i class="fa-solid fa-spinner fa-spin"></i>
            } @else {
              <span>Add</span>
            }
          </button>
        </div>
        @if (error()) {
          <p class="text-red-400 text-sm mt-2">{{ error() }}</p>
        }
      </div>

      <!-- Daily Summary -->
      <section>
        <h2 class="text-xl font-semibold mb-3">Today's Totals</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div class="bg-[#131321] p-3 rounded-lg">
            <p class="text-sm text-gray-400">Calories</p>
            <p class="text-xl font-bold text-[#00E0B8]">{{ dailyTotals().calories }}</p>
          </div>
          <div class="bg-[#131321] p-3 rounded-lg">
            <p class="text-sm text-gray-400">Protein</p>
            <p class="text-xl font-bold text-white">{{ dailyTotals().protein }}g</p>
          </div>
          <div class="bg-[#131321] p-3 rounded-lg">
            <p class="text-sm text-gray-400">Carbs</p>
            <p class="text-xl font-bold text-white">{{ dailyTotals().carbs }}g</p>
          </div>
          <div class="bg-[#131321] p-3 rounded-lg">
            <p class="text-sm text-gray-400">Fat</p>
            <p class="text-xl font-bold text-white">{{ dailyTotals().fat }}g</p>
          </div>
        </div>
      </section>

      <!-- Logged Foods -->
      <section>
        <h2 class="text-xl font-semibold mb-3">Today's Log</h2>
        <div class="space-y-2">
          @if (todaysFood().length === 0) {
            <p class="text-center text-gray-500 py-4">No food logged today.</p>
          } @else {
            @for (log of todaysFood(); track log.id) {
              <div class="bg-[#131321] p-3 rounded-lg">
                <p class="font-semibold text-white">{{ log.text }}</p>
                @if(log.estCalories) {
                  <div class="flex space-x-4 text-xs text-gray-400 mt-1">
                    <span>🔥 {{ log.estCalories }} kcal</span>
                    <span>P: {{ log.estProtein }}g</span>
                    <span>C: {{ log.estCarbs }}g</span>
                    <span>F: {{ log.estFat }}g</span>
                  </div>
                }
              </div>
            }
          }
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiCalorieComponent {
  dataService = inject(DataService);
  geminiService = inject(GeminiService);

  foodInput = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  todaysFood = this.dataService.getTodaysFoodLogs;

  dailyTotals = computed(() => {
    return this.todaysFood().reduce((acc, log) => {
      acc.calories += log.estCalories ?? 0;
      acc.protein += log.estProtein ?? 0;
      acc.carbs += log.estCarbs ?? 0;
      acc.fat += log.estFat ?? 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  hasApiKey = computed(() => this.geminiService.hasApiKey());

  logFood() {
    if (this.foodInput().trim().length === 0) return;

    this.isLoading.set(true);
    this.error.set(null);
    const foodText = this.foodInput();

    if (!this.hasApiKey()) {
        // Fallback for no API key: just log the text
        this.dataService.addFoodLog({ date: toDateString(new Date()), text: foodText });
        this.foodInput.set('');
        this.isLoading.set(false);
        this.error.set('Cannot estimate calories. API key is missing.');
        return;
    }

    this.geminiService.getCalorieEstimate(foodText).subscribe(result => {
      this.isLoading.set(false);
      if ('error' in result) {
        this.error.set(result.error);
        // Still log the text even if AI fails
        this.dataService.addFoodLog({ date: toDateString(new Date()), text: foodText });
      } else {
        const newLog: Omit<FoodLog, 'id'> = {
          date: toDateString(new Date()),
          text: foodText,
          estCalories: result.estCalories,
          estProtein: result.estProtein,
          estCarbs: result.estCarbs,
          estFat: result.estFat,
        };
        this.dataService.addFoodLog(newLog);
        this.foodInput.set('');
      }
    });
  }
}
