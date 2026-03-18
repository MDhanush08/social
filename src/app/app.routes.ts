import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AboutComponent } from './components/about/about.component';
import { authGuard } from './guards/auth.guard';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [() => {
      const auth = inject(AuthService);
      const router = inject(Router);
      if (auth.isLoggedIn()) {
        router.navigate(['/chat']);
        return false;
      }
      return true;
    }],
    component: LandingComponent,
    title: 'Social AI Hub - Welcome'
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard],
    title: 'AI Chat Hub'
  },
  {
    path: 'chat/:id',
    component: ChatComponent,
    canActivate: [authGuard],
    title: 'AI Chat Hub'
  },
  { path: 'about', component: AboutComponent },
  {
    path: 'login', component: LoginComponent, canActivate: [() => {
      const auth = inject(AuthService);
      const router = inject(Router);
      if (auth.isLoggedIn()) {
        router.navigate(['/chat']);
        return false;
      }
      return true;
    }]
  },
  {
    path: 'signup', component: SignupComponent, canActivate: [() => {
      const auth = inject(AuthService);
      const router = inject(Router);
      if (auth.isLoggedIn()) {
        router.navigate(['/chat']);
        return false;
      }
      return true;
    }]
  },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
