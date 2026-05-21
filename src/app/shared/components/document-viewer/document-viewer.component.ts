import {
  Component, Inject, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PnpConfigService } from '../../../core/services/pnp.config';
import '@pnp/sp/attachments';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DocumentViewerData {
  /** Nombre del registro (ej: "Solicitud SOL-001") */
  titulo: string;
  /** Nombre de la lista SP (ej: 'Solicitudes') */
  listaNombre: string;
  /** ID del ítem SP */
  itemId: number;
}

export interface Adjunto {
  nombre: string;
  url: string;
  tipo: 'pdf' | 'imagen' | 'docx' | 'otro';
  safeUrl?: SafeResourceUrl;
  cargando: boolean;
  error: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectarTipo(nombre: string): Adjunto['tipo'] {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                          return 'pdf';
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) return 'imagen';
  if (['doc','docx'].includes(ext))           return 'docx';
  return 'otro';
}

function iconoPorTipo(tipo: Adjunto['tipo']): string {
  return { pdf: 'picture_as_pdf', imagen: 'image', docx: 'article', otro: 'attach_file' }[tipo];
}

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatTabsModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="viewer-wrapper">

      <!-- Header -->
      <div class="viewer-header">
        <div class="header-left">
          <mat-icon class="header-icon">folder_open</mat-icon>
          <div>
            <h2 class="header-titulo">{{ data.titulo }}</h2>
            <p class="header-sub">
              {{ adjuntos().length }} documento(s) adjunto(s)
            </p>
          </div>
        </div>
        <div class="header-actions">
          @if (adjuntoActivo()) {
            <a [href]="adjuntoActivo()!.url"
               [download]="adjuntoActivo()!.nombre"
               target="_blank"
               mat-stroked-button color="primary"
               matTooltip="Descargar archivo actual">
              <mat-icon>download</mat-icon> Descargar
            </a>
          }
          <button mat-icon-button matTooltip="Cerrar" (click)="cerrar()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Estado de carga inicial -->
      @if (cargandoLista()) {
        <div class="estado-centro">
          <mat-spinner diameter="48" />
          <p>Cargando documentos adjuntos...</p>
        </div>
      } @else if (errorLista()) {
        <div class="estado-centro estado-error">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudieron cargar los documentos.</p>
          <button mat-stroked-button (click)="cargarAdjuntos()">Reintentar</button>
        </div>
      } @else if (adjuntos().length === 0) {
        <div class="estado-centro">
          <mat-icon class="empty-icon">attach_file</mat-icon>
          <p>Este registro no tiene documentos adjuntos.</p>
        </div>
      } @else {

        <!-- Tabs por documento -->
        <mat-tab-group
          class="viewer-tabs"
          animationDuration="150ms"
          (selectedIndexChange)="onTabChange($event)">

          @for (adj of adjuntos(); track adj.nombre; let i = $index) {
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">{{ iconoPorTipo(adj.tipo) }}</mat-icon>
                <span class="tab-nombre">{{ adj.nombre }}</span>
              </ng-template>

              <div class="viewer-content">
                @if (adj.cargando) {
                  <div class="estado-centro">
                    <mat-spinner diameter="40" />
                    <p>Preparando vista previa...</p>
                  </div>
                } @else if (adj.error) {
                  <div class="estado-centro estado-error">
                    <mat-icon>broken_image</mat-icon>
                    <p>No se pudo cargar la vista previa.</p>
                    <a [href]="adj.url" target="_blank" mat-stroked-button>
                      <mat-icon>open_in_new</mat-icon> Abrir en SharePoint
                    </a>
                  </div>
                } @else {

                  <!-- PDF -->
                  @if (adj.tipo === 'pdf') {
                    <iframe
                      [src]="adj.safeUrl"
                      class="viewer-frame"
                      title="{{ adj.nombre }}"
                      (load)="onFrameLoad(i)"
                      (error)="onFrameError(i)">
                    </iframe>
                  }

                  <!-- Imagen -->
                  @else if (adj.tipo === 'imagen') {
                    <div class="imagen-container">
                      <img
                        [src]="adj.safeUrl"
                        [alt]="adj.nombre"
                        class="viewer-imagen"
                        (load)="onFrameLoad(i)"
                        (error)="onFrameError(i)" />
                    </div>
                  }

                  <!-- DOCX — Office Online viewer -->
                  @else if (adj.tipo === 'docx') {
                    <iframe
                      [src]="adj.safeUrl"
                      class="viewer-frame"
                      title="{{ adj.nombre }}"
                      frameborder="0"
                      (load)="onFrameLoad(i)"
                      (error)="onFrameError(i)">
                    </iframe>
                    <div class="docx-hint">
                      <mat-icon>info_outline</mat-icon>
                      Vista previa mediante Microsoft Office Online
                    </div>
                  }

                  <!-- Otro tipo — sin vista previa -->
                  @else {
                    <div class="estado-centro">
                      <mat-icon class="empty-icon">insert_drive_file</mat-icon>
                      <p>Vista previa no disponible para este tipo de archivo.</p>
                      <a [href]="adj.url" target="_blank" mat-flat-button color="primary">
                        <mat-icon>open_in_new</mat-icon> Abrir en SharePoint
                      </a>
                    </div>
                  }
                }
              </div>
            </mat-tab>
          }

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .viewer-wrapper {
      display: flex;
      flex-direction: column;
      height: 90vh;
      width: 100%;
      overflow: hidden;
    }

    /* Header */
    .viewer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 0.5px solid #D0D8E4;
      flex-shrink: 0;
      gap: 12px;
    }
    .header-left {
      display: flex; align-items: center; gap: 12px;
    }
    .header-icon {
      font-size: 28px; width: 28px; height: 28px;
      color: #1E3A5F;
    }
    .header-titulo {
      margin: 0; font-size: 16px;
      font-weight: 500; color: #1E3A5F;
    }
    .header-sub {
      margin: 2px 0 0; font-size: 12px; color: #9BA8B5;
    }
    .header-actions {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }

    /* Estados vacíos y errores */
    .estado-centro {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px; height: 100%;
      color: #9BA8B5; text-align: center; padding: 32px;
    }
    .estado-centro p { margin: 0; font-size: 14px; }
    .estado-centro mat-icon { font-size: 52px; width: 52px; height: 52px; }
    .empty-icon { color: #D0D8E4; }
    .estado-error mat-icon { color: #E24B4A; }
    .estado-error p { color: #A32D2D; }

    /* Tabs */
    .viewer-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    ::ng-deep .viewer-tabs .mat-mdc-tab-body-wrapper {
      flex: 1;
      overflow: hidden;
    }
    ::ng-deep .viewer-tabs .mat-mdc-tab-body-content {
      height: 100%;
      overflow: hidden;
    }

    .tab-icon {
      font-size: 16px; width: 16px; height: 16px;
      margin-right: 6px; vertical-align: middle;
    }
    .tab-nombre {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }

    /* Área de contenido del viewer */
    .viewer-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #F4F6F9;
    }

    /* PDF e iframes */
    .viewer-frame {
      flex: 1;
      width: 100%;
      border: none;
      background: #fff;
    }

    /* Imágenes */
    .imagen-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      padding: 16px;
      background: #F4F6F9;
    }
    .viewer-imagen {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,.12);
    }

    /* Hint Office Online */
    .docx-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 16px;
      font-size: 11px; color: #9BA8B5;
      background: #fff;
      border-top: 0.5px solid #EEF1F5;
      flex-shrink: 0;
    }
    .docx-hint mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class DocumentViewerComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private pnp       = inject(PnpConfigService);
  dialogRef         = inject(MatDialogRef<DocumentViewerComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DocumentViewerData) {}

  adjuntos      = signal<Adjunto[]>([]);
  cargandoLista = signal(true);
  errorLista    = signal(false);
  tabActivo     = signal(0);

  adjuntoActivo = computed(() => this.adjuntos()[this.tabActivo()] ?? null);

  ngOnInit() { this.cargarAdjuntos(); }

  async cargarAdjuntos() {
    this.cargandoLista.set(true);
    this.errorLista.set(false);
    try {
      // PnPjs: obtiene los adjuntos nativos del ítem
      const attachments = await this.pnp.sp.web
        .lists.getByTitle(this.data.listaNombre)
        .items.getById(this.data.itemId)
        .attachmentFiles();

      const lista: Adjunto[] = attachments.map((a: any) => ({
        nombre:   a.FileName,
        url:      a.ServerRelativeUrl
                    ? `${window.location.origin}${a.ServerRelativeUrl}`
                    : a.Url,
        tipo:     detectarTipo(a.FileName),
        cargando: false,
        error:    false,
      }));

      // Construye SafeUrl según tipo
      lista.forEach(adj => {
        adj.safeUrl = this.buildSafeUrl(adj);
      });

      this.adjuntos.set(lista);
      this.cargandoLista.set(false);
    } catch (e) {
      console.error('[DocumentViewer] Error cargando adjuntos:', e);
      this.errorLista.set(true);
      this.cargandoLista.set(false);
    }
  }

  private buildSafeUrl(adj: Adjunto): SafeResourceUrl {
    if (adj.tipo === 'docx') {
      // Office Online necesita la URL pública completa del archivo
      const encoded = encodeURIComponent(adj.url);
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`
      );
    }
    // PDF e imágenes: URL directa de SharePoint
    // El navegador usa las cookies de sesión M365 para autenticarse
    return this.sanitizer.bypassSecurityTrustResourceUrl(adj.url);
  }

  onTabChange(index: number) { this.tabActivo.set(index); }

  onFrameLoad(index: number) {
    this.adjuntos.update(lista => {
      lista[index].cargando = false;
      return [...lista];
    });
  }

  onFrameError(index: number) {
    this.adjuntos.update(lista => {
      lista[index].error = true;
      lista[index].cargando = false;
      return [...lista];
    });
  }

  iconoPorTipo(tipo: Adjunto['tipo']): string { return iconoPorTipo(tipo); }

  cerrar() { this.dialogRef.close(); }
}