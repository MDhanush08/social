import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  postService = inject(PostService);
  router = inject(Router);

  title: string = '';
  description: string = '';
  hashtags: string = '';
  platform: string = 'Facebook';
  mediaUrl: string = '';
  imagePreview: string | ArrayBuffer | null = null;
  isLoading: boolean = false;

  platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'];

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.mediaUrl = e.target.result as string; // store base64 string
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.mediaUrl = '';
  }

  onSubmit() {
    if (!this.title.trim() || !this.description.trim()) {
      alert('Title and description are required.');
      return;
    }

    this.isLoading = true;
    const postData = {
      title: this.title,
      description: this.description,
      hashtags: this.hashtags,
      platform: this.platform,
      mediaUrl: this.mediaUrl
    };

    this.postService.createPost(postData).subscribe({
      next: (res) => {
        this.isLoading = false;
        alert('Post published successfully!');
        this.router.navigate(['/dashboard']); // Or wherever they want
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating post', err);
        alert('Failed to create post. Please try again.');
      }
    });
  }
}
