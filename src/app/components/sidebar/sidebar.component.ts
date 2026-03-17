import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  router = inject(Router);

  logout() {
    this.authService.logout();
    this.uiService.closeSidebar();
    this.router.navigate(['/']);
  }

  get isEffectivelyCollapsed() {
    return this.isDesktop() && this.uiService.isSidebarCollapsed();
  }

  toggleSidebar() {
    if (this.isDesktop()) {
      this.uiService.toggleCollapsed();
    } else {
      this.uiService.closeSidebar();
    }
  }



  isDesktop() {
    return window.innerWidth >= 768;
  }
}


