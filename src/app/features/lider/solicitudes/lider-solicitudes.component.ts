import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SolicitudesService, CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudItem } from '../../../shared/models';

interface SolicitudConCandidatos extends SolicitudItem {
  totalCandidatos: number;
  seleccionados: number;
}

@Component({
  selector: 'app-lider-solicitudes',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Solicitudes aprobadas</h2>
          <p class="subtitle">Selecciona un candidato para generar la carta oferta</p>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        @for (s of solicitudes(); track s.Id) {
          <div class="sol-card card">
            <div class="sol-header">
              <div>
                <div class="sol-id">SOL-{{ s.Id }}</div>
                <div class="sol-nombre">{{ s.Perfil_Solicitado }}</div>
                <div class="sol-meta">
                  {{ s.AreaSolicitante?.Title }} · {{ s.MotivoVacante }} ·
                  Inicio requerido: {{ s.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
                </div>
              </div>
              <div class="sol-stats">
                <div class="stat">
                  <div class="stat-val">{{ s.totalCandidatos }}</div>
                  <div class="stat-lbl">Candidatos</div>
                </div>
                <div class="stat stat-success">
                  <div class="stat-val">{{ s.seleccionados }}</div>
                  <div class="stat-lbl">Seleccionados</div>
                </div>
              </div>
            </div>

            @if (s.seleccionados > 0) {
              <div class="sol-footer">
                <button mat-flat-button color="primary" (click)="generarOferta(s)">
                  <mat-icon>description</mat-icon> Generar carta oferta
                </button>
              </div>
            } @else {
              <div class="sol-footer">
                <span class="badge badge--warning">Sin candidatos seleccionados aún</span>
              </div>
            }
          </div>
        }

        @if (solicitudes().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No hay solicitudes aprobadas pendientes de carta oferta</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .sol-card { }
    .sol-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .sol-id    { font-size: 11px; color: #9BA8B5; }
    .sol-nombre { font-size: 15px; font-weight: 500; color: #1E3A5F; margin: 2px 0; }
    .sol-meta  { font-size: 12px; color: #9BA8B5; }
    .sol-stats { display: flex; gap: 12px; }
    .stat { text-align: center; padding: 8px 16px; background: #F4F6F9; border-radius: 8px; }
    .stat-val { font-size: 20px; font-weight: 500; color: #1E3A5F; }
    .stat-lbl { font-size: 11px; color: #9BA8B5; }
    .stat-success .stat-val { color: #3B6D11; }
    .sol-footer { padding-top: 12px; border-top: 0.5px solid #EEF1F5; }
    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class LiderSolicitudesComponent implements OnInit {
  private solicitudesSvc = inject(SolicitudesService);
  private candidatosSvc  = inject(CandidatosService);
  private notif          = inject(NotificacionService);
  private router         = inject(Router);

  solicitudes = signal<SolicitudConCandidatos[]>([]);
  cargando    = signal(true);

  ngOnInit() {
    this.solicitudesSvc.getAprobadas().subscribe({
      next: async (solic) => {
        const resultado: SolicitudConCandidatos[] = [];
        for (const s of solic) {
          const candidatos = await this.candidatosSvc.getBySolicitud(s.Id).toPromise() ?? [];
          resultado.push({
            ...s,
            totalCandidatos: candidatos.length,
            seleccionados:   candidatos.filter(c => c.Estado === 'Seleccionado').length,
          });
        }
        this.solicitudes.set(resultado);
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar solicitudes'); this.cargando.set(false); },
    });
  }

  generarOferta(s: SolicitudItem) {
    this.router.navigate(['/lider/solicitudes', s.Id, 'oferta']);
  }
}
