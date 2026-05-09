import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { SolicitudesService, CandidatosService, OfertasService, ContratosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudItem, CandidatoItem, OfertaItem } from '../../../shared/models';

interface ResumenProceso {
  solicitudesTotal: number;
  solicitudesAprobadas: number;
  candidatosActivos: number;
  candidatosSeleccionados: number;
  ofertasEnviadas: number;
  ofertasAceptadas: number;
  contratosCompletados: number;
}

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Seguimiento del proceso</h2>
          <p class="subtitle">Vista consolidada del estado actual de todos los procesos</p>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <!-- KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-val">{{ resumen().solicitudesTotal }}</div>
            <div class="kpi-lbl">Solicitudes totales</div>
          </div>
          <div class="kpi-card kpi-success">
            <div class="kpi-val">{{ resumen().solicitudesAprobadas }}</div>
            <div class="kpi-lbl">Solicitudes aprobadas</div>
          </div>
          <div class="kpi-card kpi-info">
            <div class="kpi-val">{{ resumen().candidatosActivos }}</div>
            <div class="kpi-lbl">Candidatos activos</div>
          </div>
          <div class="kpi-card kpi-success">
            <div class="kpi-val">{{ resumen().candidatosSeleccionados }}</div>
            <div class="kpi-lbl">Seleccionados</div>
          </div>
          <div class="kpi-card kpi-warning">
            <div class="kpi-val">{{ resumen().ofertasEnviadas }}</div>
            <div class="kpi-lbl">Ofertas enviadas</div>
          </div>
          <div class="kpi-card kpi-success">
            <div class="kpi-val">{{ resumen().ofertasAceptadas }}</div>
            <div class="kpi-lbl">Ofertas aceptadas</div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-val">{{ resumen().contratosCompletados }}</div>
            <div class="kpi-lbl">Contratos firmados</div>
          </div>
        </div>

        <!-- Pipeline visual -->
        <div class="card pipeline-card">
          <p class="section-title">Pipeline de contratación</p>
          <div class="pipeline">
            <div class="pipeline-step">
              <div class="step-circle">{{ resumen().solicitudesTotal }}</div>
              <div class="step-label">Solicitudes</div>
            </div>
            <div class="pipeline-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="pipeline-step">
              <div class="step-circle step-success">{{ resumen().solicitudesAprobadas }}</div>
              <div class="step-label">Aprobadas</div>
            </div>
            <div class="pipeline-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="pipeline-step">
              <div class="step-circle step-info">{{ resumen().candidatosActivos }}</div>
              <div class="step-label">Candidatos</div>
            </div>
            <div class="pipeline-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="pipeline-step">
              <div class="step-circle step-warning">{{ resumen().ofertasEnviadas }}</div>
              <div class="step-label">Ofertas</div>
            </div>
            <div class="pipeline-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="pipeline-step">
              <div class="step-circle step-purple">{{ resumen().contratosCompletados }}</div>
              <div class="step-label">Contratos</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 0.5px solid #D0D8E4; border-radius: 12px; padding: 16px; text-align: center; }
    .kpi-val  { font-size: 28px; font-weight: 500; color: #1E3A5F; }
    .kpi-lbl  { font-size: 11px; color: #9BA8B5; margin-top: 4px; }
    .kpi-success { border-top: 3px solid #1D9E75; }
    .kpi-info    { border-top: 3px solid #378ADD; }
    .kpi-warning { border-top: 3px solid #BA7517; }
    .kpi-purple  { border-top: 3px solid #534AB7; }
    .pipeline-card { overflow-x: auto; }
    .pipeline { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 0; min-width: 500px; }
    .pipeline-step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .step-circle { width: 52px; height: 52px; border-radius: 50%; background: #F4F6F9; border: 2px solid #D0D8E4; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500; color: #1E3A5F; }
    .step-circle.step-success { background: #EAF3DE; border-color: #1D9E75; color: #3B6D11; }
    .step-circle.step-info    { background: #E6F1FB; border-color: #378ADD; color: #185FA5; }
    .step-circle.step-warning { background: #FAEEDA; border-color: #BA7517; color: #854F0B; }
    .step-circle.step-purple  { background: #EEEDFE; border-color: #534AB7; color: #534AB7; }
    .step-label { font-size: 12px; color: #5F6B7A; font-weight: 500; }
    .pipeline-arrow mat-icon { color: #D0D8E4; }
  `],
})
export class SeguimientoComponent implements OnInit {
  private solicitudesSvc = inject(SolicitudesService);
  private candidatosSvc  = inject(CandidatosService);
  private ofertasSvc     = inject(OfertasService);
  private contratosSvc   = inject(ContratosService);
  private notif          = inject(NotificacionService);

  cargando = signal(true);
  resumen  = signal<ResumenProceso>({
    solicitudesTotal: 0, solicitudesAprobadas: 0,
    candidatosActivos: 0, candidatosSeleccionados: 0,
    ofertasEnviadas: 0, ofertasAceptadas: 0, contratosCompletados: 0,
  });

  ngOnInit() {
    forkJoin({
      solicitudes: this.solicitudesSvc.getAll(),
      candidatos:  this.candidatosSvc.getAll(),
      ofertas:     this.ofertasSvc.getAll(),
    }).subscribe({
      next: ({ solicitudes, candidatos, ofertas }) => {
        this.resumen.set({
          solicitudesTotal:        solicitudes.length,
          solicitudesAprobadas:    solicitudes.filter(s => s.Estado_Aprobacion === 'Aprobado').length,
          candidatosActivos:       candidatos.filter(c => c.Estado !== 'Descartado').length,
          candidatosSeleccionados: candidatos.filter(c => c.Estado === 'Seleccionado').length,
          ofertasEnviadas:         ofertas.filter(o => o.Estado_Oferta === 'Enviada').length,
          ofertasAceptadas:        ofertas.filter(o => o.Estado_Oferta === 'Aceptada').length,
          contratosCompletados:    0,
        });
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar datos de seguimiento'); this.cargando.set(false); },
    });
  }
}
