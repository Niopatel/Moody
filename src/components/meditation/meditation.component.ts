import { Component, ChangeDetectionStrategy, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meditation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-3xl font-bold text-white">Meditation Timer</h1>
        <p class="text-gray-400">Find your center. Breathe in, breathe out.</p>
      </header>

      <div class="bg-[#131321] p-6 rounded-lg border border-white/10 flex flex-col items-center">
        <div class="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0b0b12]">
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle class="text-gray-700" stroke-width="3" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
            <circle 
              class="text-[#00E0B8] transition-all duration-1000"
              stroke-width="3"
              [style.strokeDasharray]="circumference"
              [style.strokeDashoffset]="strokeOffset()"
              stroke-linecap="round"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="text-center">
            <p class="text-5xl sm:text-6xl font-mono font-bold text-white">{{ formattedTime() }}</p>
            <p class="text-sm text-gray-400">{{ statusText() }}</p>
          </div>
        </div>
        
        <div class="mt-8 w-full max-w-sm">
          @if (!isRunning()) {
            <div class="space-y-4">
              <label for="duration" class="block text-sm font-medium text-gray-300 text-center">Set Duration (minutes)</label>
              <div class="flex justify-center gap-2">
                 @for (d of [5, 10, 15, 20]; track d) {
                   <button 
                    (click)="setDuration(d * 60)" 
                    class="px-4 py-2 rounded-md text-sm transition-colors"
                    [class.bg-[#7C5CFF]]="duration() === d * 60"
                    [class.text-white]="duration() === d * 60"
                    [class.bg-[#0b0b12]]="duration() !== d * 60"
                    [class.text-gray-300]="duration() !== d * 60"
                    [class.border]="duration() !== d * 60"
                    [class.border-gray-600]="duration() !== d * 60"
                    [class.hover:bg-[#7C5CFF]/20]="duration() !== d * 60"
                    >
                      {{ d }} min
                   </button>
                 }
              </div>
            </div>
            <button (click)="startTimer()" class="mt-6 w-full bg-gradient-to-r from-[#7C5CFF] to-[#00E0B8] text-white font-bold py-3 rounded-lg text-lg hover:opacity-90 transition-opacity">
              Start
            </button>
          } @else {
             <div class="flex gap-4 mt-6">
                <button (click)="pauseTimer()" class="flex-1 bg-amber-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-amber-600 transition-colors">
                  {{ isPaused() ? 'Resume' : 'Pause' }}
                </button>
                <button (click)="resetTimer()" class="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-red-700 transition-colors">
                  Stop
                </button>
             </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeditationComponent implements OnDestroy {
  duration = signal(10 * 60); // Default 10 minutes in seconds
  remainingTime = signal(this.duration());
  isRunning = signal(false);
  isPaused = signal(false);
  
  private intervalId: any;
  circumference = 2 * Math.PI * 45;

  formattedTime = computed(() => {
    const minutes = Math.floor(this.remainingTime() / 60);
    const seconds = this.remainingTime() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  statusText = computed(() => {
    if (this.isRunning() && !this.isPaused()) return 'Breathe...';
    if (this.isPaused()) return 'Paused';
    if (this.remainingTime() === 0 && this.duration() > 0) return 'Complete';
    return 'Ready';
  });
  
  strokeOffset = computed(() => {
    const progress = (this.duration() - this.remainingTime()) / this.duration();
    if (this.duration() === 0) return this.circumference;
    return this.circumference * (1 - progress);
  });

  constructor() {
    effect(() => {
        // When duration changes, reset remaining time
        this.remainingTime.set(this.duration());
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  setDuration(seconds: number): void {
    this.duration.set(seconds);
  }

  startTimer(): void {
    if (this.isRunning() || this.remainingTime() === 0) return;
    this.isRunning.set(true);
    this.isPaused.set(false);

    this.intervalId = setInterval(() => {
      if (!this.isPaused()) {
        this.remainingTime.update(t => {
          if (t > 0) {
            return t - 1;
          } else {
            this.stopAndReset();
            // Optionally play a sound here
            return 0;
          }
        });
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isPaused.update(p => !p);
  }
  
  resetTimer(): void {
    this.stopAndReset();
  }
  
  private stopAndReset(): void {
    clearInterval(this.intervalId);
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.remainingTime.set(this.duration());
  }
}
