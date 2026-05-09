import { Component, Input, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <div class="logo-mark">GC</div>
          <div>
            <div class="app-name">Contratación</div>
            <div class="rol-badge">{{ rolLabel }}</div>
          </div>
        </div>

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <div class="user-info">
            <div class="avatar">{{ auth.iniciales() }}</div>
            <div class="user-meta">
              <div class="user-name">{{ auth.usuario()?.nombre }}</div>
              <div class="user-email">{{ auth.usuario()?.email }}</div>
            </div>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar class="toolbar">
          <span class="toolbar-title">{{ pageTitle }}</span>
        </mat-toolbar>
        <div class="content-area">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }

    .sidenav {
      width: 240px;
      background: #1E3A5F;
      color: #fff;
      display: flex;
      flex-direction: column;
    }
    .sidenav-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .logo-mark {
      width: 36px; height: 36px;
      background: #378ADD;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 500; font-size: 13px; color: #fff; flex-shrink: 0;
    }
    .app-name  { font-size: 14px; font-weight: 500; color: #fff; }
    .rol-badge { font-size: 10px; color: #B5D4F4; margin-top: 2px; }

    mat-nav-list { flex: 1; padding-top: 8px; }
    a[mat-list-item] { color: #B5D4F4 !important; border-radius: 8px; margin: 2px 8px; }
    a[mat-list-item]:hover { background: rgba(255,255,255,.08) !important; }
    a[mat-list-item].active-link { background: rgba(55,138,221,.25) !important; color: #fff !important; }
    a[mat-list-item].active-link mat-icon { color: #378ADD !important; }
    mat-icon { color: #B5D4F4; }

    .sidenav-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,.1);
    }
    .user-info { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #378ADD; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 500; color: #fff; flex-shrink: 0;
    }
    .user-name  { font-size: 12px; font-weight: 500; color: #fff; }
    .user-email { font-size: 10px; color: #B5D4F4; }

    .toolbar {
      background: #fff !important;
      border-bottom: 0.5px solid #D0D8E4;
      box-shadow: none !important;
      color: #1E3A5F;
    }
    .toolbar-title { font-size: 15px; font-weight: 500; }

    .content-area { padding: 24px; overflow-y: auto; height: calc(100vh - 64px); }
  `],
})
export class LayoutShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() pageTitle = 'Gestión de Contratación';
  @Input() rolLabel  = '';
  auth = inject(AuthService);
}
