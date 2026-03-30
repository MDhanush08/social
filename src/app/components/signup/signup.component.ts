import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  platformId = inject(PLATFORM_ID);
  userData = { username: '', email: '', password: '' };
  error = '';
  loading = false;
  showPassword = false;

  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize Social logins after component is ready
      setTimeout(() => {
        this.initializeGoogleLogin();
      }, 100);
    }
  }

  loginWithFacebook() {
    window.location.href = 'http://localhost:5000/api/auth/facebook';
  }

  private initializeGoogleLogin() {
    const google = (window as any).google;
    if (google) {
      google.accounts.id.initialize({
        client_id: '410000210340-rdmbtboro0jdspqo8ouhbv569o54h1p5.apps.googleusercontent.com', // Replace with their actual ID
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        { theme: 'filled_blue', size: 'large', width: '320px', shape: 'pill' }
      );
    }
  }

  private handleGoogleLogin(response: any) {
    this.loading = true;
    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error = 'Google Sign-In failed';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.authService.register(this.userData).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
