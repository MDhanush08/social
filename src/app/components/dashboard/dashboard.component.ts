import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);
  dashboardData: any = null;
  postMessage = '';
  selectedImage: string | ArrayBuffer | null = null;
  aiResponse: string | null = null;
  analyzing = false;

  ngOnInit() {
    this.http.get('http://localhost:5000/api/dashboard').subscribe({
      next: (data) => this.dashboardData = data,
      error: (err) => console.error('Error fetching dashboard data', err)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  onSend() {
    if (this.postMessage.trim() || this.selectedImage) {
      this.analyzing = true;
      this.aiResponse = null;

      this.http.post<any>('http://localhost:5000/api/analyze', {
        prompt: this.postMessage,
        image: this.selectedImage
      }).subscribe({
        next: (res) => {
          this.aiResponse = res.answer;
          this.analyzing = false;
          // Clear inputs after successful analysis
          this.postMessage = '';
          this.selectedImage = null;
        },
        error: (err) => {
          console.error('Analysis failed', err);
          this.analyzing = false;
        }
      });
    }
  }
}
