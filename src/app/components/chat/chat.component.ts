import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat';
import { UiService } from '../../services/ui.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp?: Date;
  data?: any;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  authService = inject(AuthService);
  chatService = inject(ChatService);
  uiService = inject(UiService);

  userInput = '';
  selectedImage: string | null = null;
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);
  conversations = signal<any[]>([]);
  activeChatId = signal<string | null>(null);
  previewImage = signal<string | null>(null);
  selectedChips = new Map<number, Set<string>>();
  isSidebarDesktopOpen = signal(true); // For responsive behavior

  searchQuery = signal<string>('');

  showDeleteModal = signal(false);
  chatToDelete = signal<string | null>(null);

  filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.conversations();
    return this.conversations().filter(c => c.title.toLowerCase().includes(query));
  });

  activeChatTitle = computed(() => {
    const id = this.activeChatId();
    if (!id) return 'New Chat';
    const chat = this.conversations().find(c => c._id === id);
    return chat ? chat.title : 'Current Chat';
  });

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadSessions();

      // Detect chat selection from sidebar
      this.activatedRoute.queryParams.subscribe(params => {
        if (params['id'] && params['id'] !== this.activeChatId()) {
          this.selectChat(params['id']);
        }
      });
    }
  }

  loadSessions() {
    this.chatService.getHistory().subscribe({
      next: (sessions) => this.conversations.set(sessions),
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

  openDeleteModal(chatId: string, event: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.chatToDelete.set(chatId);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.chatToDelete.set(null);
  }

  confirmDeleteChat() {
    const chatId = this.chatToDelete();
    if (!chatId) return;

    this.chatService.deleteChat(chatId).subscribe({
      next: () => {
        this.conversations.set(this.conversations().filter(c => c._id !== chatId));
        if (this.activeChatId() === chatId) {
          this.startNewChat();
        }
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting chat:', err);
        this.closeDeleteModal();
      }
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
      reader.onload = (e: any) => this.selectedImage = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeImage() { this.selectedImage = null; }

  toggleChip(msgIndex: number, chip: string) {
    const currentSet = this.selectedChips.get(msgIndex) || new Set<string>();
    currentSet.has(chip) ? currentSet.delete(chip) : currentSet.add(chip);
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

    const history = this.messages();
    const relatedUserMsg = history[msgIndex - 1];
    let imageToResend = (relatedUserMsg?.role === 'user' && relatedUserMsg.image) ? relatedUserMsg.image : null;

    this.sendConstructedMessage(prompt, imageToResend);
    this.selectedChips.delete(msgIndex);
  }

  openPreview(imgSrc: string) { this.previewImage.set(imgSrc); }
  closePreview() { this.previewImage.set(null); }

  sendMessage() {
    if ((!this.userInput.trim() && !this.selectedImage) || this.isLoading()) return;
    this.sendConstructedMessage(this.userInput, this.selectedImage);
  }

  onEnterKey(event: any) {
    if (!this.isLoading() && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
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
        if (res?.assistantMessage) {
          this.messages.update(msgs => [...msgs, res.assistantMessage]);
        } else if (res?.reply) {
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: res.reply }]);
        }

        if (!this.activeChatId() && res.chatId) {
          this.activeChatId.set(res.chatId);
          this.loadSessions();
        }

        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: 'Error: Could not process request.' }]);
        this.isLoading.set(false);
        this.scrollToBottom();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 100);
  }
}
