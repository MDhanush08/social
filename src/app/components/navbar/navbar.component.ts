import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
    this.uiService.toggleSidebar();
  }

  closeMenu() {
    this.uiService.closeSidebar();
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }
}
