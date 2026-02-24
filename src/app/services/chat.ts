import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5000/api/chat';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`, { headers: this.getHeaders() });
  }

  getChatDetails(chatId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${chatId}`, { headers: this.getHeaders() });
  }

  sendMessage(prompt: string, image?: string | null, chatId?: string | null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send`, { prompt, image, chatId }, { headers: this.getHeaders() });
  }
}

