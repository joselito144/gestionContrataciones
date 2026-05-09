import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sin-permiso',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <mat-icon class="icon">block</mat-icon>
      <h1>Sin permisos</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <button mat-flat-button color="primary" (click)="volver()">Volver al inicio</button>
    </div>
  `,
  styles: [`
    .error-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #1E3A5F; }
    .icon { font-size: 64px; width: 64px; height: 64px; color: #D0D8E4; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    p  { margin: 0; color: #5F6B7A; }
  `],
})
export class SinPermisoComponent {
  router = inject(Router);
  volver() { this.router.navigate(['/dashboard']); }
}
