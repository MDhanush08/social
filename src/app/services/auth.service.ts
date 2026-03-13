import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private platformId = inject(PLATFORM_ID);


  // Use signals for easy state management in modern Angular
  currentUser = signal<any>(null);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      const user = localStorage.getItem(this.userKey);
      if (token && user) {
        this.currentUser.set(JSON.parse(user));
      }
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((res: any) => this.setSession(res))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => this.setSession(res))
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUser.set(null);
  }

  private setSession(authResult: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, authResult.token);
      localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
    }
    this.currentUser.set(authResult.user);
  }


  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
