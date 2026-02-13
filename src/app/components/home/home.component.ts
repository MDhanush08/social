import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp?: Date;
  data?: any; // Structured JSON data
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  chatService = inject(ChatService);

  userInput = '';
  selectedImage: string | null = null;
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);

  // New: Chips Logic Removed

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.chatService.getHistory().subscribe({
      next: (history) => {
        if (history.length > 0) {
          // Attempt to parse existing history if it's JSON
          const parsedHistory = history.map(msg => {
            if (msg.role === 'assistant') {
              try {
                const parsed = JSON.parse(msg.content);
                return { ...msg, data: parsed };
              } catch (e) {
                // Not JSON, keep as is
                return msg;
              }
            }
            return msg;
          });
          this.messages.set(parsedHistory);
        } else {
          this.messages.set([
            { role: 'assistant', content: 'Hello! I am your Social AI assistant. How can I help you today?' }
          ]);
        }
        this.scrollToBottom();
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  sendMessage() {
    if ((!this.userInput.trim() && !this.selectedImage) || this.isLoading()) return;

    const userContent = this.userInput;
    const userImage = this.selectedImage;

    // Add user message locally
    const userMsg: ChatMessage = {
      role: 'user',
      content: userContent,
      image: userImage || undefined,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.userInput = '';
    this.selectedImage = null;
    this.isLoading.set(true);
    this.scrollToBottom();

    // Send to service
    this.chatService.sendMessage(userContent, userImage).subscribe({
      next: (res) => {
        // Backend returns { reply, userMessage, assistantMessage }
        if (res && res.assistantMessage) {
          this.messages.update(msgs => [...msgs, res.assistantMessage]);
          this.isLoading.set(false);
          this.scrollToBottom();
        } else if (res && res.reply) {
          // Fallback for legacy/simple backend response
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: res.reply }]);
          this.isLoading.set(false);
          this.scrollToBottom();
        } else {
          // Fallback for valid response but unknown format
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure your API key is configured and try again.'
        }]);
        this.isLoading.set(false);
        this.scrollToBottom();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show toast or feedback
      console.log('Copied to clipboard');
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 100);
  }
}
