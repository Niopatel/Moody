import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-3xl font-bold text-white">Wellness Tools</h1>
        <p class="text-gray-400">Resources for your mental well-being journey.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Addiction Control -->
        <div class="bg-[#131321] p-6 rounded-lg border border-transparent hover:border-[#7C5CFF]/50 transition-colors">
          <i class="fa-solid fa-shield-halved text-3xl text-[#7C5CFF] mb-3"></i>
          <h2 class="text-xl font-semibold mb-2">Addiction Control</h2>
          <p class="text-sm text-gray-400 mb-4">Log urges, find SOS tools, and track your progress one day at a time.</p>
          <button class="bg-[#7C5CFF]/20 text-[#7C5CFF] font-semibold px-4 py-2 rounded-lg hover:bg-[#7C5CFF]/40">Open Tools</button>
        </div>

        <!-- Depression & Phobia Help -->
        <div class="bg-[#131321] p-6 rounded-lg border border-transparent hover:border-[#00E0B8]/50 transition-colors">
          <i class="fa-solid fa-sun text-3xl text-[#00E0B8] mb-3"></i>
          <h2 class="text-xl font-semibold mb-2">Self-Help Aids</h2>
          <p class="text-sm text-gray-400 mb-4">Daily micro-tasks and mood reflections for depression and phobia improvement.</p>
          <button class="bg-[#00E0B8]/20 text-[#00E0B8] font-semibold px-4 py-2 rounded-lg hover:bg-[#00E0B8]/40">Start Micro-tasks</button>
        </div>

        <!-- OCD / Overthinking Aids -->
        <div class="bg-[#131321] p-6 rounded-lg border border-transparent hover:border-[#7C5CFF]/50 transition-colors">
          <i class="fa-solid fa-brain text-3xl text-[#7C5CFF] mb-3"></i>
          <h2 class="text-xl font-semibold mb-2">OCD / Overthinking</h2>
          <p class="text-sm text-gray-400 mb-4">Log intrusive thoughts, practice 4-7-8 breathing, and use the "worry postpone" timer.</p>
          <button class="bg-[#7C5CFF]/20 text-[#7C5CFF] font-semibold px-4 py-2 rounded-lg hover:bg-[#7C5CFF]/40">Access Aids</button>
        </div>
        
        <!-- Weight Management -->
        <div class="bg-[#131321] p-6 rounded-lg border border-transparent hover:border-[#00E0B8]/50 transition-colors">
          <i class="fa-solid fa-weight-scale text-3xl text-[#00E0B8] mb-3"></i>
          <h2 class="text-xl font-semibold mb-2">Weight AI Tips</h2>
          <p class="text-sm text-gray-400 mb-4">Get AI-generated micro-habits and meal plans tailored to your weight goals.</p>
          <button class="bg-[#00E0B8]/20 text-[#00E0B8] font-semibold px-4 py-2 rounded-lg hover:bg-[#00E0B8]/40">Get Tips</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsComponent {
  // Logic for different tools would be implemented here
}