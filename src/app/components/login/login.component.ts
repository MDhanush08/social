import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  platformId = inject(PLATFORM_ID);
  credentials = { email: '', password: '' };
  error = '';
  loading = false;
  showPassword = false;

  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if we are returning from Facebook login
      this.handleFacebookCallback();

      // Initialize Social logins after component is ready
      setTimeout(() => {
        this.initializeGoogleLogin();
      }, 100);
    }
  }

  private handleFacebookCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');

    if (token && userData) {
      this.authService.setSessionFromParams(token, userData);
      this.router.navigate(['/chat']);
    }
  }

  // loginWithFacebook() {
  //   const appId = '1257622752619676';
  //   // const redirectUri = 'http://localhost:5000/api/auth/facebook/callback';
  //   const redirectUri = 'http://localhost:5000/auth/facebook/callback';
  //   // const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=email,public_profile`;
  //   const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=email`;
  //   window.location.href = url;
  // }

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
        document.getElementById('google-login-btn'),
        { theme: 'filled_blue', size: 'large', width: '320px', shape: 'pill' }
      );
    }
  }

  private handleGoogleLogin(response: any) {
    console.log("rsponce google data >>>>", response);

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

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }
}
