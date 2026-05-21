import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import {
  SolicitudesService,
  ParticipacionesService,
  OfertasService,
  ContratosService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';

interface Kpi { valor: number; label: string; color: string; }

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Seguimiento del proceso</h2>
          <p class="subtitle">Estado consolidado de todos los procesos activos</p>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {

        <!-- KPIs -->
        <div class="kpi-grid">
          @for (k of kpis(); track k.label) {
            <div class="kpi-card" [style.border-top-color]="k.color">
              <div class="kpi-val" [style.color]="k.color">{{ k.valor }}</div>
              <div class="kpi-lbl">{{ k.label }}</div>
            </div>
          }
        </div>

        <!-- Pipeline visual -->
        <div class="card">
          <p class="section-title">Pipeline de contratación</p>
          <div class="pipeline">
            <div class="pipeline-step">
              <div class="step-num">{{ solicitudesTotal() }}</div>
              <div class="step-lbl">Solicitudes</div>
            </div>
            <mat-icon class="pipe-arrow">arrow_forward</mat-icon>
            <div class="pipeline-step step-blue">
              <div class="step-num">{{ solicitudesAprobadas() }}</div>
              <div class="step-lbl">Aprobadas</div>
            </div>
            <mat-icon class="pipe-arrow">arrow_forward</mat-icon>
            <div class="pipeline-step step-teal">
              <div class="step-num">{{ participacionesActivas() }}</div>
              <div class="step-lbl">Candidatos activos</div>
            </div>
            <mat-icon class="pipe-arrow">arrow_forward</mat-icon>
            <div class="pipeline-step step-success">
              <div class="step-num">{{ seleccionados() }}</div>
              <div class="step-lbl">Seleccionados</div>
            </div>
            <mat-icon class="pipe-arrow">arrow_forward</mat-icon>
            <div class="pipeline-step step-warning">
              <div class="step-num">{{ ofertasEnviadas() }}</div>
              <div class="step-lbl">Ofertas enviadas</div>
            </div>
            <mat-icon class="pipe-arrow">arrow_forward</mat-icon>
            <div class="pipeline-step step-purple">
              <div class="step-num">{{ ofertasAceptadas() }}</div>
              <div class="step-lbl">Ofertas aceptadas</div>
            </div>
          </div>

          <!-- Tasa de conversión -->
          @if (solicitudesTotal() > 0) {
            <div class="conversion-row">
              <span class="conv-label">Tasa de conversión (solicitud → oferta aceptada)</span>
              <span class="conv-val">
                {{ ((ofertasAceptadas() / solicitudesTotal()) * 100) | number:'1.0-0' }}%
              </span>
            </div>
          }
        </div>

      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px; margin-bottom: 20px;
    }
    .kpi-card {
      background: #fff; border: 0.5px solid #D0D8E4;
      border-top: 3px solid #D0D8E4;
      border-radius: 12px; padding: 16px; text-align: center;
    }
    .kpi-val  { font-size: 28px; font-weight: 500; }
    .kpi-lbl  { font-size: 11px; color: #9BA8B5; margin-top: 4px; }

    .pipeline {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 16px 0; flex-wrap: wrap;
    }
    .pipeline-step {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .step-num {
      width: 52px; height: 52px; border-radius: 50%;
      background: #F4F6F9; border: 2px solid #D0D8E4;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 500; color: #1E3A5F;
    }
    .step-lbl  { font-size: 11px; color: #5F6B7A; font-weight: 500; text-align: center; max-width: 70px; }
    .pipe-arrow { color: #D0D8E4; }

    .step-blue    .step-num { background: #E6F1FB; border-color: #378ADD; color: #185FA5; }
    .step-teal    .step-num { background: #E1F5EE; border-color: #1D9E75; color: #3B6D11; }
    .step-success .step-num { background: #EAF3DE; border-color: #1D9E75; color: #3B6D11; }
    .step-warning .step-num { background: #FAEEDA; border-color: #BA7517; color: #854F0B; }
    .step-purple  .step-num { background: #EEEDFE; border-color: #534AB7; color: #534AB7; }

    .conversion-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 0 0; border-top: 0.5px solid #EEF1F5; margin-top: 8px;
    }
    .conv-label { font-size: 12px; color: #5F6B7A; }
    .conv-val   { font-size: 16px; font-weight: 500; color: #1E3A5F; }
  `],
})
export class SeguimientoComponent implements OnInit {
  private solicitudesSvc   = inject(SolicitudesService);
  private participacionSvc = inject(ParticipacionesService);
  private ofertasSvc       = inject(OfertasService);
  private notif            = inject(NotificacionService);

  cargando = signal(true);

  solicitudesTotal    = signal(0);
  solicitudesAprobadas = signal(0);
  participacionesActivas = signal(0);
  seleccionados       = signal(0);
  ofertasEnviadas     = signal(0);
  ofertasAceptadas    = signal(0);

  kpis = signal<Kpi[]>([]);

  ngOnInit() {
    forkJoin({
      solicitudes:    this.solicitudesSvc.getAll(),
      participaciones: this.solicitudesSvc.getAll().pipe(), // reutilizamos solicitudes
      ofertas:        this.ofertasSvc.getAll(),
    }).subscribe({
      next: ({ solicitudes, ofertas }) => {
        // Solicitudes
        const total     = solicitudes.length;
        const aprobadas = solicitudes.filter(s => s.Estado_Aprobacion === 'Aprobado').length;
        const rechazadas = solicitudes.filter(s => s.Estado_Aprobacion === 'Rechazado').length;

        // Ofertas
        const enviadas  = ofertas.filter(o => o.Estado_Oferta === 'Enviada').length;
        const aceptadas = ofertas.filter(o => o.Estado_Oferta === 'Aceptada').length;
        const rechazadasOfertas = ofertas.filter(o => o.Estado_Oferta === 'Rechazada').length;

        this.solicitudesTotal.set(total);
        this.solicitudesAprobadas.set(aprobadas);
        this.ofertasEnviadas.set(enviadas);
        this.ofertasAceptadas.set(aceptadas);

        // Cargar participaciones en paralelo para conteos
        this.participacionSvc['sp'].getAll('Participaciones', {
          select: ['Id', 'Estado'],
        }).subscribe({
          next: (parts: any[]) => {
            this.participacionesActivas.set(
              parts.filter((p: any) => p.Estado !== 'Descartado').length
            );
            this.seleccionados.set(
              parts.filter((p: any) => p.Estado === 'Seleccionado').length
            );
            this.buildKpis(total, aprobadas, rechazadas, parts, enviadas, aceptadas, rechazadasOfertas);
            this.cargando.set(false);
          },
          error: () => {
            this.buildKpis(total, aprobadas, rechazadas, [], enviadas, aceptadas, rechazadasOfertas);
            this.cargando.set(false);
          },
        });
      },
      error: () => { this.notif.error('Error al cargar datos'); this.cargando.set(false); },
    });
  }

  buildKpis(total: number, aprobadas: number, rechazadas: number,
            parts: any[], enviadas: number, aceptadas: number, rechazadasOfertas: number) {
    const activos     = parts.filter(p => p.Estado !== 'Descartado').length;
    const selec       = parts.filter(p => p.Estado === 'Seleccionado').length;
    const descartados = parts.filter(p => p.Estado === 'Descartado').length;

    this.kpis.set([
      { valor: total,             label: 'Solicitudes totales',    color: '#1E3A5F' },
      { valor: aprobadas,         label: 'Solicitudes aprobadas',  color: '#1D9E75' },
      { valor: rechazadas,        label: 'Solicitudes rechazadas', color: '#E24B4A' },
      { valor: activos,           label: 'Candidatos activos',     color: '#378ADD' },
      { valor: selec,             label: 'Candidatos seleccionados', color: '#3B6D11' },
      { valor: descartados,       label: 'Candidatos descartados', color: '#9BA8B5' },
      { valor: enviadas,          label: 'Ofertas enviadas',       color: '#BA7517' },
      { valor: aceptadas,         label: 'Ofertas aceptadas',      color: '#534AB7' },
      { valor: rechazadasOfertas, label: 'Ofertas rechazadas',     color: '#E24B4A' },
    ]);
  }
}