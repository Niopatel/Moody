import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, QuizQuestion, AnalysisReport } from '../../services/gemini.service';
import { TranslationService } from '../../services/translation.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const jspdf: any; // For jsPDF library from CDN

type AnalysisState = 'selectingTopic' | 'takingQuiz' | 'analyzing' | 'showingReport' | 'error';

interface Topic {
  id: 'Depression' | 'Anxiety' | 'OCD' | 'Trauma' | 'Addiction' | 'Phobia';
  translationKey: string;
  icon: string;
}

@Component({
  selector: 'app-ai-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-3xl font-bold text-white">{{ t('ai_analysis_title') }}</h1>
        <p class="text-gray-400">{{ t('ai_analysis_subtitle') }}</p>
      </header>
      
      @if (!hasApiKey()) {
        <div class="bg-amber-900/50 border border-amber-500/50 rounded-lg p-4 text-center">
          <p class="text-amber-300">AI features are disabled. Please go to Settings to add your Gemini API key.</p>
        </div>
      }

      <div class="p-6 bg-[#131321] rounded-lg border border-white/10 min-h-[500px] flex flex-col justify-center">
        @switch (state()) {
          @case ('selectingTopic') {
            <div class="text-center">
              <h2 class="text-xl font-semibold mb-6 text-gray-200">{{ t('ai_analysis_select_topic') }}</h2>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                @for(topic of topics; track topic.id) {
                  <button (click)="selectTopic(topic)" [disabled]="!hasApiKey()" class="flex flex-col items-center p-4 bg-[#0b0b12] rounded-lg hover:bg-[#7C5CFF]/20 border border-gray-700 hover:border-[#7C5CFF]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="{{ topic.icon }} text-3xl text-[#7C5CFF]"></i>
                    <span class="mt-2 font-medium text-gray-200">{{ t(topic.translationKey) }}</span>
                  </button>
                }
              </div>
            </div>
          }
          @case ('takingQuiz') {
            <div>
              <h2 class="text-xl font-semibold mb-6 text-gray-200">{{ t('ai_analysis_quiz_title') }}: {{ t(selectedTopic()!.translationKey) }}</h2>
              <div class="space-y-6">
                @for(q of quizQuestions(); track $index) {
                  <fieldset>
                    <legend class="text-base font-medium text-gray-100">{{ $index + 1 }}. {{ q.question }}</legend>
                    <div class="mt-2 space-y-2">
                      @for(option of q.options; track option) {
                        <label class="flex items-center p-2 rounded-md hover:bg-white/10">
                          <input type="radio" [name]="'question-' + $index" [value]="option" [(ngModel)]="quizAnswers()[$index]" class="h-4 w-4 text-[#7C5CFF] bg-gray-700 border-gray-600 focus:ring-[#7C5CFF]">
                          <span class="ml-3 text-sm text-gray-300">{{ option }}</span>
                        </label>
                      }
                    </div>
                  </fieldset>
                }
              </div>
              <div class="mt-8 flex justify-end">
                <button (click)="submitQuiz()" [disabled]="!isQuizComplete()" class="px-6 py-2 bg-[#7C5CFF] text-white rounded-md hover:bg-[#6a48ff] disabled:bg-violet-500/30">
                  {{ t('ai_analysis_submit_quiz') }}
                </button>
              </div>
            </div>
          }
          @case ('analyzing') {
            <div class="text-center">
              <svg class="animate-spin mx-auto h-12 w-12 text-[#7C5CFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-4 text-lg text-gray-400">{{ t('ai_analysis_generating_report') }}</p>
            </div>
          }
          @case ('showingReport') {
            @if(analysisReport(); as report) {
              <div>
                <div class="prose prose-sm md:prose-base prose-invert max-w-none space-y-4">
                    <div [innerHTML]="sanitizeHtml(report.summary)"></div>
                    <h4 class="font-semibold text-lg text-[#00E0B8]">{{ t('report_brain_regions') }}</h4>
                    <div [innerHTML]="sanitizeHtml(report.brainRegions)"></div>
                    <h4 class="font-semibold text-lg text-[#00E0B8]">{{ t('report_herbal_reco') }}</h4>
                    <div [innerHTML]="sanitizeHtml(report.herbalRecommendations)"></div>
                    <h4 class="font-semibold text-lg text-[#00E0B8]">{{ t('report_advice') }}</h4>
                    <div [innerHTML]="sanitizeHtml(report.advice)"></div>
                </div>
                
                <div class="mt-8 flex flex-col sm:flex-row gap-4">
                  <button (click)="downloadAsPdf()" class="flex-1 px-4 py-2 bg-green-600/80 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2">
                    <i class="fas fa-file-pdf"></i> {{ t('ai_analysis_download_pdf') }}
                  </button>
                  <button (click)="restart()" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2">
                    <i class="fas fa-redo"></i> {{ t('ai_analysis_restart') }}
                  </button>
                </div>
              </div>
            }
          }
          @case ('error') {
            <div class="text-center">
              <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
              <p class="mt-4 text-lg text-red-400">An Error Occurred</p>
              <p class="mt-2 text-gray-400">{{ error() }}</p>
              <button (click)="restart()" class="mt-6 px-4 py-2 bg-[#7C5CFF] text-white rounded-md hover:bg-[#6a48ff]">
                Try Again
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiAnalysisComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);
  translationService = inject(TranslationService);

  state = signal<AnalysisState>('selectingTopic');
  error = signal<string | null>(null);
  selectedTopic = signal<Topic | null>(null);
  quizQuestions = signal<QuizQuestion[]>([]);
  quizAnswers = signal<string[]>([]);
  analysisReport = signal<AnalysisReport | null>(null);

  private translations: { [key: string]: string } = {
    'ai_analysis_title': 'AI Mental Wellness Analysis',
    'ai_analysis_subtitle': 'A preliminary self-assessment for personal insight.',
    'ai_analysis_select_topic': 'Choose a topic to explore',
    'topic_depression': 'Depression',
    'topic_anxiety': 'Anxiety',
    'topic_ocd': 'OCD',
    'topic_trauma': 'Trauma',
    'topic_addiction': 'Addiction',
    'topic_phobia': 'Phobia',
    'ai_analysis_quiz_title': 'Self-Assessment Quiz',
    'ai_analysis_submit_quiz': 'Get My Analysis',
    'ai_analysis_generating_report': 'Generating your personalized report...',
    'report_summary': 'Summary',
    'report_brain_regions': 'Associated Brain Regions',
    'report_herbal_reco': 'Herbal Recommendations',
    'report_advice': 'Actionable Advice',
    'ai_analysis_download_pdf': 'Download as PDF',
    'ai_analysis_restart': 'Start a New Analysis',
  };

  t(key: string): string {
    return this.translations[key] || key;
  }
  
  topics: Topic[] = [
    { id: 'Depression', translationKey: 'topic_depression', icon: 'fa-solid fa-cloud-rain' },
    { id: 'Anxiety', translationKey: 'topic_anxiety', icon: 'fa-solid fa-bolt' },
    { id: 'OCD', translationKey: 'topic_ocd', icon: 'fa-solid fa-repeat' },
    { id: 'Trauma', translationKey: 'topic_trauma', icon: 'fa-solid fa-hand-fist' },
    { id: 'Addiction', translationKey: 'topic_addiction', icon: 'fa-solid fa-bottle-droplet' },
    { id: 'Phobia', translationKey: 'topic_phobia', icon: 'fa-solid fa-spider' },
  ];
  
  hasApiKey = computed(() => this.geminiService.hasApiKey());

  selectTopic(topic: Topic): void {
    this.selectedTopic.set(topic);
    this.state.set('analyzing'); // Show loading while generating quiz
    this.error.set(null);
    const lang = this.translationService.currentLang();

    this.geminiService.generateQuizQuestions(topic.id, lang).subscribe(result => {
      if ('error' in result) {
        this.error.set(result.error);
        this.state.set('error');
      } else {
        this.quizQuestions.set(result);
        this.quizAnswers.set(new Array(result.length).fill(''));
        this.state.set('takingQuiz');
      }
    });
  }

  submitQuiz(): void {
    this.state.set('analyzing');
    this.error.set(null);
    const lang = this.translationService.currentLang();
    const answers = this.quizQuestions().map((q, i) => ({
      question: q.question,
      answer: this.quizAnswers()[i]
    }));

    this.geminiService.getAnalysisReport(this.selectedTopic()!.id, lang, answers).subscribe(result => {
      if ('error' in result) {
        this.error.set(result.error);
        this.state.set('error');
      } else {
        this.analysisReport.set(result);
        this.state.set('showingReport');
      }
    });
  }

  isQuizComplete = computed(() => this.quizAnswers().every(a => a && a.length > 0));

  restart(): void {
    this.state.set('selectingTopic');
    this.selectedTopic.set(null);
    this.quizQuestions.set([]);
    this.quizAnswers.set([]);
    this.analysisReport.set(null);
    this.error.set(null);
  }

  sanitizeHtml(html: string): SafeHtml {
      try {
        const parsedHtml = marked.parse(html);
        return this.sanitizer.bypassSecurityTrustHtml(parsedHtml as string);
      } catch(e) {
        return html;
      }
  }

  async downloadAsPdf(): Promise<void> {
    const report = this.analysisReport();
    if (!report) return;

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // Basic properties
    const margin = 15;
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;

    doc.setFontSize(18);
    doc.text(this.t('ai_analysis_title'), pageWidth / 2, y, { align: 'center' });
    y += 10;

    const addSection = (titleKey: string, content: string) => {
        y += 10;
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(this.t(titleKey), margin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        
        // Remove markdown list chars for PDF
        const cleanedContent = content.replace(/[\*\-]/g, '').trim();
        const splitText = doc.splitTextToSize(cleanedContent, usableWidth);
        
        doc.text(splitText, margin, y);
        y += splitText.length * 5 + 5; // Adjust y position
    };

    addSection('report_summary', report.summary);
    addSection('report_brain_regions', report.brainRegions);
    addSection('report_herbal_reco', report.herbalRecommendations);
    addSection('report_advice', report.advice);

    doc.save(`MOODY_AI_Analysis_${this.selectedTopic()?.id}.pdf`);
  }
}
