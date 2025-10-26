// FIX: Implemented application routes with lazy loading and auth guard.
import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'trends',
        loadComponent: () => import('./components/trends/trends.component').then(m => m.TrendsComponent)
      },
      {
        path: 'ai-calorie',
        loadComponent: () => import('./components/ai-calorie/ai-calorie.component').then(m => m.AiCalorieComponent)
      },
      {
        path: 'weight-ai',
        loadComponent: () => import('./components/weight-ai/weight-ai.component').then(m => m.WeightAiComponent)
      },
      {
        path: 'ai-coach',
        loadComponent: () => import('./components/ai-coach/ai-coach.component').then(m => m.AiCoachComponent)
      },
      {
        path: 'ai-analysis',
        loadComponent: () => import('./components/ai-analysis/ai-analysis.component').then(m => m.AiAnalysisComponent)
      },
      {
        path: 'ai-diet-coach',
        loadComponent: () => import('./components/ai-diet-coach/ai-diet-coach.component').then(m => m.AiDietCoachComponent)
      },
      {
        path: 'meditation',
        loadComponent: () => import('./components/meditation/meditation.component').then(m => m.MeditationComponent)
      },
      {
        path: 'yoga-coach',
        loadComponent: () => import('./components/yoga-coach/yoga-coach.component').then(m => m.YogaCoachComponent)
      },
      {
        path: 'tools',
        loadComponent: () => import('./components/tools/tools.component').then(m => m.ToolsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'home' } // Fallback route
];