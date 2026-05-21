// ── Botón reutilizable para abrir el visor ────────────────────────────────────
// Uso: <app-doc-viewer-button titulo="SOL-001" lista="Solicitudes" [itemId]="s.Id" />
import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentViewerService } from './document-viewer.service';

@Component({
  selector: 'app-doc-viewer-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-stroked-button
      color="primary"
      [matTooltip]="'Ver documentos adjuntos de ' + titulo"
      (click)="abrir()">
      <mat-icon>folder_open</mat-icon>
      {{ label }}
    </button>
  `,
})
export class DocViewerButtonComponent {
  @Input() titulo  = '';
  @Input() lista   = '';
  @Input() itemId  = 0;
  @Input() label   = 'Ver documentos';

  private svc = inject(DocumentViewerService);

  abrir() {
    if (!this.lista || !this.itemId) return;
    this.svc.abrir(this.titulo, this.lista, this.itemId);
  }
}