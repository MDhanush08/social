import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }
}
