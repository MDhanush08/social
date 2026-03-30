import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Post {
  _id?: string;
  title: string;
  description: string;
  hashtags: string;
  platform: string;
  mediaUrl?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5000/api/posts';

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  createPost(postData: any): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, postData, this.getHeaders());
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, this.getHeaders());
  }
}
