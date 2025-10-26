import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type PracticeId = 'anulomVilom' | 'bhramari' | 'uddiyanaBandha';

interface YogaPractice {
  id: PracticeId;
  title: string;
  description: string;
  videoId: string;
  benefits: string[];
  contraindications: string[];
  steps: string[];
  category: 'Focus' | 'Reduce Overthinking';
  icon: string;
}

@Component({
  selector: 'app-yoga-coach',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-3xl font-bold text-white">Yoga Coach</h1>
        <p class="text-gray-400">Pranayama & Bandhas for Mind Clarity</p>
      </header>
    
      <!-- Focus Set -->
      <section>
        <h2 class="text-xl font-semibold mb-3 text-[#7C5CFF]">Focus Set</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (practice of practices; track practice.id) {
            @if (practice.category === 'Focus') {
              <div (click)="selectPractice(practice)" class="bg-[#131321] p-4 rounded-lg cursor-pointer hover:bg-[#1a1a2e] transition-colors border border-transparent hover:border-[#7C5CFF]/50">
                <div class="flex items-center space-x-4">
                  <i [class]="practice.icon + ' text-3xl text-[#7C5CFF]'"></i>
                  <div>
                    <h3 class="font-bold text-lg">{{ practice.title }}</h3>
                    <p class="text-sm text-gray-400">{{ practice.description }}</p>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </section>
    
      <!-- Reduce Overthinking Set -->
      <section>
        <h2 class="text-xl font-semibold mb-3 text-[#00E0B8]">Reduce Overthinking Set</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (practice of practices; track practice.id) {
            @if (practice.category === 'Reduce Overthinking') {
              <div (click)="selectPractice(practice)" class="bg-[#131321] p-4 rounded-lg cursor-pointer hover:bg-[#1a1a2e] transition-colors border border-transparent hover:border-[#00E0B8]/50">
                <div class="flex items-center space-x-4">
                  <i [class]="practice.icon + ' text-3xl text-[#00E0B8]'"></i>
                  <div>
                    <h3 class="font-bold text-lg">{{ practice.title }}</h3>
                    <p class="text-sm text-gray-400">{{ practice.description }}</p>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </section>
    
      @if (selectedPractice(); as practice) {
        <!-- Modal backdrop -->
        <div (click)="closePractice()" class="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <!-- Modal content -->
          <div (click)="$event.stopPropagation()" class="bg-[#0b0b12] border border-[#7C5CFF]/50 rounded-lg shadow-2xl shadow-[#7C5CFF]/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button (click)="closePractice()" class="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
              <i class="fas fa-times text-2xl"></i>
            </button>
            
            <h2 class="text-3xl font-bold mb-4 text-white">{{ practice.title }}</h2>
            
             <!-- YouTube Embed -->
            <div class="relative w-full overflow-hidden mb-6" style="padding-top: 56.25%;">
              <iframe [src]="getVideoUrl(practice.videoId)" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen
                      class="absolute top-0 left-0 w-full h-full rounded-lg"></iframe>
            </div>

            <div class="space-y-6">
              <p class="text-lg text-gray-300">{{ practice.description }}</p>
              
              <div>
                <h3 class="text-xl font-semibold mb-2 text-[#00E0B8]">Benefits</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-300">
                  @for(benefit of practice.benefits; track benefit) {
                    <li>{{ benefit }}</li>
                  }
                </ul>
              </div>
              
              <div>
                <h3 class="text-xl font-semibold mb-2 text-[#00E0B8]">Steps</h3>
                <ol class="list-decimal list-inside space-y-2 text-gray-300">
                  @for(step of practice.steps; track step) {
                    <li>{{ step }}</li>
                  }
                </ol>
              </div>
    
              <div>
                <h3 class="text-xl font-semibold mb-2 text-red-400">Contraindications</h3>
                <ul class="list-disc list-inside space-y-1 text-red-300 bg-red-900/50 border border-red-500/50 p-4 rounded-md">
                  @for(item of practice.contraindications; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YogaCoachComponent {
  private sanitizer = inject(DomSanitizer);

  practices: YogaPractice[] = [
    {
      id: 'anulomVilom',
      title: 'Anulom-Vilom Pranayama (Alternate Nostril Breathing)',
      description: 'Alternate nostril breathing to balance energy.',
      videoId: 'RUFzLVf5wL4',
      category: 'Focus',
      icon: 'fa-solid fa-wind',
      benefits: ['Calms the mind', 'Improves focus', 'Balances energy channels'],
      contraindications: ['Not recommended during illness or fever.'],
      steps: ['Sit comfortably with a straight spine.', 'Close right nostril, inhale through left.', 'Close left, exhale through right.', 'Inhale through right.', 'Close right, exhale through left. This is one round.']
    },
    {
      id: 'bhramari',
      title: 'Bhramari Pranayama (Humming Bee Breath)',
      description: 'Humming bee breath to soothe the nervous system.',
      videoId: 'jHAa1B0XctU',
      category: 'Reduce Overthinking',
      icon: 'fa-solid fa-user-ninja',
      benefits: ['Reduces stress and anxiety', 'Lowers blood pressure', 'Calms agitation'],
      contraindications: ['Avoid if you have an active ear infection.'],
      steps: ['Sit comfortably.', 'Close your ears with your thumbs.', 'Inhale deeply.', 'Exhale slowly while making a humming sound like a bee.', 'Repeat 6-12 times.']
    },
    {
      id: 'uddiyanaBandha',
      title: 'Uddiyana Bandha (Abdominal Lock)',
      description: 'The abdominal lock for internal cleansing.',
      videoId: 'fBr_TJ8pjCE',
      category: 'Reduce Overthinking',
      icon: 'fa-solid fa-compress',
      benefits: ['Massages abdominal organs', 'Improves digestion', 'Strengthens diaphragm'],
      contraindications: ['High blood pressure', 'Pregnancy', 'Vertigo', 'Hernia. MUST be done on an empty stomach.'],
      steps: ['Stand with feet apart, knees bent.', 'Exhale completely, forcing all air out.', 'Pull the abdomen in and up under the rib cage.', 'Hold for a few seconds.', 'Inhale and release.']
    }
  ];

  selectedPractice = signal<YogaPractice | null>(null);

  selectPractice(practice: YogaPractice) {
    this.selectedPractice.set(practice);
  }

  closePractice() {
    this.selectedPractice.set(null);
  }

  getVideoUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }
}