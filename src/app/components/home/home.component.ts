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

  // State for image preview
  previewImage = signal<string | null>(null);

  // Track selected chips per message ID or index
  // Map of messageIndex -> Set<string> of selected chips
  selectedChips = new Map<number, Set<string>>();

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
          const parsedHistory = history.map(msg => {
            // Parse data if string
            let data = msg.data;
            if (msg.role === 'assistant' && typeof msg.content === 'string') {
              // Existing parse logic if needed, but data should be separate now
            }
            return { ...msg, data };
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

  // --- Chip Handling ---

  toggleChip(msgIndex: number, chip: string) {
    const currentSet = this.selectedChips.get(msgIndex) || new Set<string>();
    if (currentSet.has(chip)) {
      currentSet.delete(chip);
    } else {
      currentSet.add(chip);
    }
    this.selectedChips.set(msgIndex, currentSet);
  }

  isChipSelected(msgIndex: number, chip: string): boolean {
    return this.selectedChips.get(msgIndex)?.has(chip) ?? false;
  }

  hasSelectedChips(msgIndex: number): boolean {
    return (this.selectedChips.get(msgIndex)?.size ?? 0) > 0;
  }

  submitChips(msgIndex: number) {
    const chipsSet = this.selectedChips.get(msgIndex);
    if (!chipsSet || chipsSet.size === 0) return;

    const selectedChipsList = Array.from(chipsSet);
    const prompt = `Please provide the following based on the image: ${selectedChipsList.join(', ')}.`;

    // Find the image from the *previous* user message
    // msgIndex is the assistant message. The user message that triggered it should be msgIndex - 1.
    // However, we should verify.
    const history = this.messages();
    const assistantMsg = history[msgIndex];
    const relatedUserMsg = history[msgIndex - 1];

    let imageToResend = this.selectedImage; // Default to current if exists (unlikely here)

    if (relatedUserMsg && relatedUserMsg.role === 'user' && relatedUserMsg.image) {
      imageToResend = relatedUserMsg.image;
    }

    if (!imageToResend && !this.selectedImage) {
      // If we can't find the image, we can't contextually answer "Title for this image".
      // But maybe the backend has history? usage suggests backend is stateless.
      // We will try without image if logic fails, but ideally we send it.
    }

    // Reuse sendMessage logic but with constructed prompt and recovered image
    this.sendConstructedMessage(prompt, imageToResend || null);

    // Clear selection
    this.selectedChips.delete(msgIndex);
  }

  // --- Image Preview ---
  openPreview(imgSrc: string) {
    this.previewImage.set(imgSrc);
  }

  closePreview() {
    this.previewImage.set(null);
  }

  // --- Sending ---

  sendMessage() {
    if ((!this.userInput.trim() && !this.selectedImage) || this.isLoading()) return;
    this.sendConstructedMessage(this.userInput, this.selectedImage);
  }

  private sendConstructedMessage(content: string, image: string | null) {
    const userMsg: ChatMessage = {
      role: 'user',
      content: content,
      image: image || undefined,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.userInput = '';
    this.selectedImage = null;
    this.isLoading.set(true);
    this.scrollToBottom();

    this.chatService.sendMessage(content, image).subscribe({
      next: (res) => {
        if (res && res.assistantMessage) {
          this.messages.update(msgs => [...msgs, res.assistantMessage]);
        } else if (res && res.reply) {
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: res.reply }]);
        }
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: 'Error: Could not process request.'
        }]);
        this.isLoading.set(false);
        this.scrollToBottom();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
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
