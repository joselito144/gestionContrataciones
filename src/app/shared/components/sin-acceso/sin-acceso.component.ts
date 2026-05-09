import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-acceso',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <mat-icon class="icon">lock</mat-icon>
      <h1>Sin acceso</h1>
      <p>Tu usuario no tiene un rol asignado en esta aplicación.</p>
      <p>Contacta al administrador para solicitar acceso.</p>
    </div>
  `,
  styles: [`
    .error-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #1E3A5F; }
    .icon { font-size: 64px; width: 64px; height: 64px; color: #D0D8E4; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    p  { margin: 0; color: #5F6B7A; }
  `],
})
export class SinAccesoComponent {}
