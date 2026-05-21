// ── Servicio para abrir el visor desde cualquier componente ──────────────────
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  DocumentViewerComponent,
  DocumentViewerData,
} from './document-viewer.component';

@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  private dialog = inject(MatDialog);

  /**
   * Abre el visor de documentos como modal de ancho completo.
   *
   * @param titulo    Texto del header del modal (ej: "Solicitud SOL-001")
   * @param listaNombre Nombre exacto de la lista en SP (ej: 'Solicitudes')
   * @param itemId    ID del ítem cuyo attachments se van a mostrar
   */
  abrir(titulo: string, listaNombre: string, itemId: number): void {
    const data: DocumentViewerData = { titulo, listaNombre, itemId };

    this.dialog.open(DocumentViewerComponent, {
      data,
      width:     '96vw',
      maxWidth:  '96vw',
      height:    '92vh',
      maxHeight: '92vh',
      panelClass: 'document-viewer-dialog',
      disableClose: false,
    });
  }
}