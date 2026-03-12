import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isSidebarOpen = signal(false);
  isSidebarCollapsed = signal(false);
  isChatHistoryOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  toggleCollapsed() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleChatHistory() {
    this.isChatHistoryOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
    this.isChatHistoryOpen.set(false);
  }
}
