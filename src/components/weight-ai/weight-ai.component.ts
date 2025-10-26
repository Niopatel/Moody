import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';
import { toDateString } from '../../utils/date-helpers';
import { FoodLog, WeightLog } from '../../models/moody.model';

@Component({
  selector: 'app-weight-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-white">Weight AI</h1>
        <p class="text-gray-400">Track weight and analyze meal photos.</p>
      </header>

      @if (!hasApiKey()) {
        <div class="bg-amber-900/50 border border-amber-500/50 rounded-lg p-4 text-center">
          <p class="text-amber-300">AI features are disabled. Please go to Settings to add your Gemini API key.</p>
        </div>
      }

      <!-- AI Calorie from Image -->
      <section class="bg-[#131321] p-6 rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4">AI Calorie Estimator from Image</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <!-- Uploader -->
          <div class="space-y-4">
            <label for="file-upload" class="w-full text-center block bg-[#0b0b12] border-2 border-dashed border-gray-600 rounded-lg p-8 cursor-pointer hover:border-[#7C5CFF] transition-colors">
              <i class="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-2"></i>
              <p class="font-semibold text-white">Click to upload an image</p>
              <p class="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </label>
            <input id="file-upload" type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
            
            @if (previewUrl()) {
              <div class="space-y-4">
                <img [src]="previewUrl()" alt="Meal preview" class="rounded-lg max-h-48 w-full object-cover">
                <input type="text" [(ngModel)]="foodDescription" placeholder="Optional: Add a description (e.g., lunch)" class="w-full bg-[#0b0b12] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]">
                <button (click)="analyzeImage()" [disabled]="isLoading() || !hasApiKey()" class="w-full bg-[#7C5CFF] text-white px-5 py-3 rounded-md font-semibold hover:bg-[#6a48ff] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                  @if(isLoading()) {
                    <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                    <span>Analyzing...</span>
                  } @else {
                    <span>Analyze Meal</span>
                  }
                </button>
              </div>
            }
          </div>

          <!-- Results -->
          <div class="bg-[#0b0b12] rounded-lg p-4 min-h-[200px] flex flex-col justify-center">
            @if (isLoading()) {
              <p class="text-center text-gray-400">AI is analyzing your meal...</p>
            } @else if (error()) {
              <p class="text-center text-red-400">{{ error() }}</p>
            } @else if (analysisResult(); as result) {
              <div class="space-y-3">
                <h3 class="font-bold text-lg text-center text-[#00E0B8]">Analysis Complete</h3>
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div class="bg-[#131321] p-2 rounded">
                    <p class="text-sm text-gray-400">Calories</p>
                    <p class="font-bold text-lg text-white">{{ result.estCalories }} kcal</p>
                  </div>
                  <div class="bg-[#131321] p-2 rounded">
                    <p class="text-sm text-gray-400">Protein</p>
                    <p class="font-bold text-lg text-white">{{ result.estProtein }}g</p>
                  </div>
                  <div class="bg-[#131321] p-2 rounded">
                    <p class="text-sm text-gray-400">Carbs</p>
                    <p class="font-bold text-lg text-white">{{ result.estCarbs }}g</p>
                  </div>
                  <div class="bg-[#131321] p-2 rounded">
                    <p class="text-sm text-gray-400">Fat</p>
                    <p class="font-bold text-lg text-white">{{ result.estFat }}g</p>
                  </div>
                </div>
                <button (click)="logAnalyzedMeal()" class="w-full bg-[#00E0B8]/80 hover:bg-[#00E0B8] text-black font-semibold p-3 rounded-lg transition-colors">Log This Meal</button>
              </div>
            } @else {
              <p class="text-center text-gray-500">Upload an image of your meal to get an AI-powered nutritional estimate.</p>
            }
          </div>
        </div>
      </section>

      <!-- Weight Tracker -->
      <section class="bg-[#131321] p-6 rounded-lg border border-white/10">
        <h2 class="text-xl font-semibold mb-4">Weight Tracker</h2>
        <form (ngSubmit)="logWeight()" class="flex flex-col sm:flex-row sm:items-end gap-2 mb-6">
          <div class="flex-1">
            <label for="weight" class="sr-only">Today's Weight (kg)</label>
            <input id="weight" type="number" step="0.1" [(ngModel)]="weightInput" name="weightInput" placeholder="Enter current weight (kg)" class="w-full bg-[#0b0b12] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]">
          </div>
          <button type="submit" [disabled]="!weightInput() || weightInput()! <= 0" class="w-full sm:w-auto bg-[#7C5CFF] text-white px-5 py-3 rounded-md font-semibold hover:bg-[#6a48ff] disabled:bg-gray-600 transition-colors">Log</button>
        </form>
        
        @if (graphData().hasData) {
          <div class="bg-[#0b0b12] rounded-lg p-4">
            <svg [attr.viewBox]="'0 0 500 180'" class="w-full h-auto">
              <!-- Grid Lines -->
              <line x1="10" y1="20" x2="495" y2="20" stroke="#374151" stroke-width="0.5" />
              <line x1="10" y1="130" x2="495" y2="130" stroke="#374151" stroke-width="0.5" />

              <!-- Path -->
              <path [attr.d]="graphData().path" fill="none" stroke="#00E0B8" stroke-width="2" />
              
              <!-- Points -->
              @for (point of graphData().points; track point.x) {
                <circle [attr.cx]="point.x" [attr.cy]="point.y" r="3" fill="#00E0B8" />
              }

              <!-- Labels -->
              @for (label of graphData().labels; track label.x + '-' + label.y) {
                <text [attr.x]="label.x" [attr.y]="label.y" [attr.text-anchor]="label.anchor || 'start'" fill="#9CA3AF" font-size="10">{{ label.text }}</text>
              }
            </svg>
          </div>
        } @else {
          <div class="text-center py-8 text-gray-500">
            <p>Log at least two weight entries to see your progress graph.</p>
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeightAiComponent {
  dataService = inject(DataService);
  geminiService = inject(GeminiService);

  // Image Analysis State
  selectedFile = signal<File | null>(null);
  imageBase64 = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  foodDescription = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  analysisResult = signal<Partial<FoodLog> | null>(null);

  // Weight Tracking State
  weightInput = signal<number | null>(null);
  sortedWeightLogs = this.dataService.sortedWeightLogs;
  
  hasApiKey = computed(() => this.geminiService.hasApiKey());

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.analysisResult.set(null);
      this.error.set(null);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl.set(e.target.result);
        // Store base64 string without the data URL prefix
        this.imageBase64.set(e.target.result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  }

  analyzeImage(): void {
    if (!this.imageBase64() || !this.selectedFile()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    this.geminiService.getCalorieEstimateFromImage(
      this.foodDescription(), 
      this.imageBase64()!, 
      this.selectedFile()!.type
    ).subscribe(result => {
      this.isLoading.set(false);
      if ('error' in result) {
        this.error.set(result.error);
      } else {
        this.analysisResult.set(result);
      }
    });
  }

  logAnalyzedMeal(): void {
    if (!this.analysisResult()) return;

    const newLog: Omit<FoodLog, 'id'> = {
      date: toDateString(new Date()),
      text: this.foodDescription() || 'Meal from image',
      ...this.analysisResult()
    };
    this.dataService.addFoodLog(newLog);
    
    // Reset fields
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.imageBase64.set(null);
    this.foodDescription.set('');
    this.analysisResult.set(null);
  }

  logWeight(): void {
    if (this.weightInput() && this.weightInput()! > 0) {
      this.dataService.addWeightLog(this.weightInput()!);
      this.weightInput.set(null);
    }
  }

  // Graph generation logic
  graphData = computed(() => {
    const logs = this.sortedWeightLogs();
    if (logs.length < 2) {
      return { path: '', points: [], labels: [], hasData: false };
    }

    const width = 500;
    const height = 150;
    const paddingY = 20; // top and bottom padding
    const paddingX = 10; // left and right padding for labels

    const weights = logs.map(l => l.weightKg);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight;

    const availableWidth = width - 2 * paddingX;
    const availableHeight = height - 2 * paddingY;

    const points = logs.map((log, index) => {
      const x = (index / (logs.length - 1)) * availableWidth + paddingX;
      const yValue = weightRange === 0 
        ? availableHeight / 2 
        : ((log.weightKg - minWeight) / weightRange) * availableHeight;
      const y = height - paddingY - yValue;
      return { x, y, log };
    });

    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

    const labels = [
      { x: paddingX, y: height, text: logs[0].date },
      { x: width - paddingX, y: height, text: logs[logs.length-1].date, anchor: 'end' },
      { x: width - 5, y: paddingY + 4, text: `${maxWeight.toFixed(1)}kg`, anchor: 'end' },
      { x: width - 5, y: height - paddingY + 4, text: `${minWeight.toFixed(1)}kg`, anchor: 'end' }
    ];

    return { path, points, labels, hasData: true };
  });
}
