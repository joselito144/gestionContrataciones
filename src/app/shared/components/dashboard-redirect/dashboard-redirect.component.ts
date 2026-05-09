import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="splash">
      <div class="splash-card">
        <mat-spinner diameter="40" />
        <h2>Gestión de Contratación</h2>
        <p>Verificando acceso...</p>
        @if (auth.error()) {
          <p class="error">{{ auth.error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .splash { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1E3A5F; }
    .splash-card { text-align: center; color: #fff; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    h2 { margin: 0; font-size: 20px; font-weight: 500; }
    p  { margin: 0; color: #B5D4F4; font-size: 13px; }
    .error { color: #f09595; max-width: 280px; }
    mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
  `],
})
export class DashboardRedirectComponent implements OnInit {
  auth   = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    switch (this.auth.rol()) {
      case 'Administrador': this.router.navigate(['/admin']);    break;
      case 'AnalistaTH':    this.router.navigate(['/analista']); break;
      case 'LiderArea':     this.router.navigate(['/lider']);    break;
      default:              this.router.navigate(['/sin-acceso']); break;
    }
  }
}
