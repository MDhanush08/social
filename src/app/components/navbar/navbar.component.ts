import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);

  toggleMenu() {
    if (this.isDesktop()) {
      this.uiService.toggleCollapsed();
    } else {
      this.uiService.toggleSidebar();
    }
  }

  isDesktop() {
    return window.innerWidth >= 768;
  }

  closeMenu() {
    this.uiService.closeSidebar();
  }

  router = inject(Router);

  logout() {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
