import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
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

  // Multiple Chats logic
  conversations = signal<any[]>([]);
  activeChatId = signal<string | null>(null);

  activeChatTitle = computed(() => {
    const id = this.activeChatId();
    if (!id) return 'New Chat';
    const chat = this.conversations().find(c => c._id === id);
    return chat ? chat.title : 'Current Chat';
  });


  // State for image preview
  previewImage = signal<string | null>(null);

  // Track selected chips per message ID or index
  selectedChips = new Map<number, Set<string>>();

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadSessions();
    }
  }

  loadSessions() {
    this.chatService.getHistory().subscribe({
      next: (sessions) => {
        this.conversations.set(sessions);
        // Do not automatically load the first one unless the user wants to
        // If we want to auto-load last chat:
        if (sessions.length > 0 && !this.activeChatId()) {
          // this.selectChat(sessions[0]._id);
        }
      },
      error: (err) => console.error('Error loading sessions:', err)
    });
  }

  selectChat(chatId: string) {
    this.activeChatId.set(chatId);
    this.isLoading.set(true);
    this.chatService.getChatDetails(chatId).subscribe({
      next: (history) => {
        this.messages.set(history);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error loading chat details:', err);
        this.isLoading.set(false);
      }
    });
  }

  startNewChat() {
    this.activeChatId.set(null);
    this.messages.set([
      { role: 'assistant', content: 'Hello! I am your Social AI assistant. Start a new conversation by sending a message or uploading an image.' }
    ]);
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

    this.chatService.sendMessage(content, image, this.activeChatId()).subscribe({
      next: (res) => {
        if (res && res.assistantMessage) {
          this.messages.update(msgs => [...msgs, res.assistantMessage]);
        } else if (res && res.reply) {
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: res.reply }]);
        }

        // If this was a new chat, update the activeChatId and refresh sessions
        if (!this.activeChatId() && res.chatId) {
          this.activeChatId.set(res.chatId);
          this.loadSessions(); // Refresh sidebar titles
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
