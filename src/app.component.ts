import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-[#0b0b12] text-gray-200 font-sans">
      <!-- Sidebar -->
      <aside 
        class="w-64 flex-shrink-0 bg-[#131321] border-r border-white/10 flex-col fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out md:translate-x-0"
        [class.-translate-x-full]="!isSidebarOpen()">
        <div class="flex items-center justify-center h-20 border-b border-white/10">
          <h1 class="text-2xl font-bold text-center text-[#7C5CFF]">MOODY AI</h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
          @for(item of navItems; track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-[#7C5CFF] text-white"
               (click)="isSidebarOpen.set(false)"
               class="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-[#7C5CFF]/20 hover:text-white transition-colors duration-200">
              <i class="{{ item.icon }} w-6 text-center text-lg"></i>
              <span class="ml-3">{{ item.name }}</span>
            </a>
          }
        </nav>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col md:ml-64">
        <header class="flex items-center justify-between h-20 px-6 bg-[#131321] border-b border-white/10 md:justify-end">
          <!-- Mobile menu button -->
          <button (click)="isSidebarOpen.set(!isSidebarOpen())" class="md:hidden text-gray-300 hover:text-white">
            <i class="fas fa-bars text-2xl"></i>
          </button>
          
          <div class="flex items-center space-x-4">
              <span class="text-sm">Welcome, {{ currentUser()?.name }}</span>
              <button (click)="logout()" class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Logout</button>
          </div>
        </header>
        
        <main class="flex-1 p-6 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Overlay for mobile sidebar -->
      @if (isSidebarOpen()) {
        <div (click)="isSidebarOpen.set(false)" class="fixed inset-0 bg-black/60 z-20 md:hidden"></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private userService = inject(UserService);
  // FIX: Explicitly type `router` to avoid type inference issues.
  private router: Router = inject(Router);

  isSidebarOpen = signal(false);
  currentUser = this.userService.currentUser;
  
  navItems = [
    { name: 'Home', path: '/home', icon: 'fas fa-home' },
    { name: 'Trends', path: '/trends', icon: 'fas fa-chart-line' },
    { name: 'AI Calorie Log', path: '/ai-calorie', icon: 'fas fa-calculator' },
    { name: 'Weight AI', path: '/weight-ai', icon: 'fas fa-weight-scale' },
    { name: 'AI Coach', path: '/ai-coach', icon: 'fas fa-robot' },
    { name: 'AI Analysis', path: '/ai-analysis', icon: 'fas fa-brain' },
    { name: 'AI Diet + Workout Coach', path: '/ai-diet-coach', icon: 'fas fa-utensils' },
    { name: 'Meditation', path: '/meditation', icon: 'fas fa-spa' },
    { name: 'Yoga Coach', path: '/yoga-coach', icon: 'fas fa-person-praying' },
    { name: 'Wellness Tools', path: '/tools', icon: 'fas fa-toolbox' },
    { name: 'Settings', path: '/settings', icon: 'fas fa-cog' },
  ];

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/auth']);
  }
}