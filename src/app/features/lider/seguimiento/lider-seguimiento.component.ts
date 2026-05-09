import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { OfertasService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { OfertaItem, EstadoOferta } from '../../../shared/models';

@Component({
  selector: 'app-lider-seguimiento',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Seguimiento de ofertas</h2>
          <p class="subtitle">Estado de las cartas oferta y contratos generados</p>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        @for (o of ofertas(); track o.Id) {
          <div class="oferta-card card">
            <div class="oferta-header">
              <div>
                <div class="oferta-cargo">{{ o.Cargo }}</div>
                <div class="oferta-candidato">{{ o.ID_Candidato?.Title }}</div>
              </div>
              <div class="oferta-right">
                <span [class]="'badge badge--' + badgeEstado(o.Estado_Oferta)">{{ o.Estado_Oferta }}</span>
                <div class="oferta-salario">{{ o.Salario_Ofertado | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
              </div>
            </div>

            <div class="oferta-timeline">
              <div class="tl-item" [class.done]="o.Aprobada_DirAdm">
                <mat-icon>{{ o.Aprobada_DirAdm ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Aprobada Dir. Adm</span>
              </div>
              <div class="tl-item" [class.done]="o.Fecha_Envio">
                <mat-icon>{{ o.Fecha_Envio ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Enviada al aspirante {{ o.Fecha_Envio ? ('(' + (o.Fecha_Envio | date:'dd/MM') + ')') : '' }}</span>
              </div>
              <div class="tl-item" [class.done]="o.Estado_Oferta === 'Aceptada'" [class.rejected]="o.Estado_Oferta === 'Rechazada'">
                <mat-icon>{{ o.Estado_Oferta === 'Aceptada' ? 'check_circle' : (o.Estado_Oferta === 'Rechazada' ? 'cancel' : 'radio_button_unchecked') }}</mat-icon>
                <span>Respuesta aspirante</span>
              </div>
            </div>

            @if (o.PDF_Oferta_URL) {
              <div class="oferta-footer">
                <a [href]="o.PDF_Oferta_URL.Url" target="_blank" class="pdf-link">
                  <mat-icon>picture_as_pdf</mat-icon> Ver carta oferta
                </a>
              </div>
            }
          </div>
        }

        @if (ofertas().length === 0) {
          <div class="empty-state">
            <mat-icon>description</mat-icon>
            <p>No hay cartas oferta generadas aún</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .oferta-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .oferta-cargo     { font-size: 15px; font-weight: 500; color: #1E3A5F; }
    .oferta-candidato { font-size: 12px; color: #9BA8B5; margin-top: 2px; }
    .oferta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .oferta-salario { font-size: 13px; font-weight: 500; color: #3B6D11; }
    .oferta-timeline { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 0.5px solid #EEF1F5; border-bottom: 0.5px solid #EEF1F5; margin-bottom: 10px; }
    .tl-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9BA8B5; }
    .tl-item mat-icon { font-size: 18px; width: 18px; height: 18px; color: #D0D8E4; }
    .tl-item.done { color: #3B6D11; }
    .tl-item.done mat-icon { color: #1D9E75; }
    .tl-item.rejected { color: #A32D2D; }
    .tl-item.rejected mat-icon { color: #E24B4A; }
    .oferta-footer { }
    .pdf-link { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #185FA5; text-decoration: none; }
    .pdf-link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class LiderSeguimientoComponent implements OnInit {
  private ofertasSvc = inject(OfertasService);
  private notif      = inject(NotificacionService);

  ofertas  = signal<OfertaItem[]>([]);
  cargando = signal(true);

  ngOnInit() {
    this.ofertasSvc.getAll().subscribe({
      next:  o => { this.ofertas.set(o); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar ofertas'); this.cargando.set(false); },
    });
  }

  badgeEstado(e: EstadoOferta): string {
    return { Enviada: 'warning', Aceptada: 'success', Rechazada: 'danger', Vencida: 'neutral' }[e] ?? 'neutral';
  }
}
