// FIX: Implement the AiCoachComponent with a full chat interface.
import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiCoachService } from '../../services/ai-coach.service';
import { ChatMessage } from '../../models/moody.model';

@Component({
  selector: 'app-ai-coach',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-[#131321] rounded-lg shadow-md border border-white/10">
      <header class="p-4 border-b border-white/10">
        <h1 class="text-xl font-semibold text-white">AI Wellness Coach</h1>
        <p class="text-sm text-gray-400">Your personal AI-powered guide, MOODY AI.</p>
      </header>
      
      <div #chatContainer (scroll)="handleScroll()" class="flex-1 p-4 overflow-y-auto space-y-4 relative">
        @for (message of messages(); track $index) {
          <div class="flex" [class.justify-end]="message.role === 'user'">
            <div 
              class="max-w-prose p-3 rounded-lg"
              [class.bg-[#7C5CFF]]="message.role === 'user'"
              [class.text-white]="message.role === 'user'"
              [class.bg-[#1f1f30]]="message.role === 'model'"
              [class.text-gray-300]="message.role === 'model'">
              <p [innerHTML]="formatMessage(message.text)"></p>
              @if (isStreaming() && $last && message.role === 'model') {
                <span class="inline-block w-2 h-2 ml-1 bg-current rounded-full animate-ping"></span>
              }
            </div>
          </div>
        }
        
        @if (userScrolledUp()) {
          <button (click)="scrollToBottom(true)"
                  class="absolute bottom-4 right-4 z-10 bg-[#7C5CFF] text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:bg-[#6a48ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C5CFF] focus:ring-offset-gray-800 animate-bounce"
                  title="Scroll to bottom">
            <i class="fas fa-arrow-down"></i>
          </button>
        }
      </div>

      <footer class="p-4 border-t border-white/10">
        @if (error()) {
          <div class="text-red-400 text-sm mb-2">{{ error() }}</div>
        }
        <form (ngSubmit)="sendMessage()" class="flex items-center space-x-2">
          <input 
            type="text"
            [(ngModel)]="userInput"
            name="userInput"
            placeholder="Type your message..."
            [disabled]="isLoading() || !hasApiKey()"
            class="flex-1 p-2 border rounded-md bg-[#0b0b12] border-gray-600 text-white focus:ring-[#7C5CFF] focus:border-[#7C5CFF]"
            autocomplete="off">
          
          <button 
            type="button" 
            (click)="toggleListening()"
            [disabled]="!speechRecognitionSupported || isLoading() || !hasApiKey()"
            class="px-4 py-2 rounded-md transition-colors text-white"
            [class.bg-red-500]="isListening()"
            [class.hover:bg-red-600]="isListening()"
            [class.bg-[#7C5CFF]]="!isListening()"
            [class.hover:bg-[#6a48ff]]="!isListening()"
            [class.opacity-50]="!speechRecognitionSupported || isLoading() || !hasApiKey()"
            [title]="speechRecognitionSupported ? (isListening() ? 'Stop Listening' : 'Talk to AI') : 'Speech recognition not supported'">
            <i class="fas" [class.fa-microphone-slash]="isListening()" [class.fa-microphone]="!isListening()"></i>
          </button>

          <button 
            type="submit" 
            [disabled]="isLoading() || userInput().trim().length === 0 || !hasApiKey()"
            class="px-4 py-2 bg-[#7C5CFF] text-white rounded-md hover:bg-[#6a48ff] disabled:bg-violet-500/30 disabled:cursor-not-allowed">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
         @if (!hasApiKey()) {
          <p class="text-xs text-amber-500 mt-2">AI features are disabled. API key not found.</p>
        }
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiCoachComponent {
  aiCoachService = inject(AiCoachService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLDivElement>;

  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  isStreaming = signal(false);
  error = signal<string | null>(null);
  userScrolledUp = signal(false);

  hasApiKey = computed(() => this.aiCoachService.hasApiKey());

  private recognition: any;
  speechRecognitionSupported = false;
  isListening = signal(false);

  constructor() {
    this.messages.set(this.aiCoachService.startChat());
    afterNextRender(() => {
        this.setupSpeechRecognition();
        this.scrollToBottom(true);
    });
  }

  sendMessage(): void {
    if (this.userInput().trim().length === 0 || this.isLoading()) return;

    const message = this.userInput();
    this.messages.update(m => [...m, { role: 'user', text: message }]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.isStreaming.set(true);
    this.error.set(null);
    this.scrollToBottom();
    
    // Add a placeholder for the streaming response
    this.messages.update(m => [...m, { role: 'model', text: '' }]);

    this.aiCoachService.sendMessageStream(message).subscribe({
      next: (chunk) => {
        this.messages.update(m => {
            const lastMessage = m[m.length - 1];
            if (lastMessage) {
                lastMessage.text += chunk;
            }
            return [...m];
        });
        this.scrollToBottom();
      },
      error: (err) => {
        this.error.set(err.message || 'An error occurred.');
        this.messages.update(m => {
            const lastMessage = m[m.length - 1];
            if(lastMessage) {
                lastMessage.text = 'Sorry, I encountered an error. Please try again.';
            }
            return [...m];
        });
        this.isLoading.set(false);
        this.isStreaming.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
        this.isStreaming.set(false);
      }
    });
  }
  
  formatMessage(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  handleScroll(): void {
    const element = this.chatContainer.nativeElement;
    // Show button if user has scrolled up more than a small threshold
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    this.userScrolledUp.set(!atBottom);
  }

  scrollToBottom(force: boolean = false): void {
    // Only auto-scroll if forced or if the user is already near the bottom
    if (force || !this.userScrolledUp()) {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTo({
                    top: this.chatContainer.nativeElement.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 10);
    }
  }

  private setupSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognitionSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.userInput.update(v => v + transcript);
      };

      this.recognition.onspeechend = () => {
        this.stopListening();
      };
      
      this.recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          this.stopListening();
      }
    }
  }

  toggleListening(): void {
    if (!this.recognition) return;
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening(): void {
    this.recognition.start();
    this.isListening.set(true);
  }

  private stopListening(): void {
    if (this.recognition) {
        this.recognition.stop();
    }
    this.isListening.set(false);
  }
}