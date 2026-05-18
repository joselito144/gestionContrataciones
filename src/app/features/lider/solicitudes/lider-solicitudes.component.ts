import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SolicitudesService, CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudItem, EstadoAprobacion } from '../../../shared/models';

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
          <h2>Mis solicitudes</h2>
          <p class="subtitle">Solicitudes de personal registradas por ti</p>
        </div>
        <button mat-flat-button color="primary" (click)="nueva()">
          <mat-icon>add</mat-icon> Nueva solicitud
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        @for (s of solicitudes(); track s.Id) {
          <div class="sol-card card">
            <div class="sol-header">
              <div>
                <div class="sol-id">SOL-{{ s.Id }}</div>
                <div class="sol-nombre">{{ s.Pefil_solicitado?.Cargo }}</div>
                <div class="sol-meta">
                  {{ s.AreaSolicitante?.Title }} · {{ s.MotivoVacante }} ·
                  Inicio requerido: {{ s.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
                </div>
              </div>
              <div class="sol-right">
                <span [class]="'badge badge--' + badgeEstado(s.Estado_Aprobacion)">
                  {{ s.Estado_Aprobacion }}
                </span>
                <div class="sol-stats">
                  <div class="stat">
                    <div class="stat-val">{{ s.totalCandidatos }}</div>
                    <div class="stat-lbl">Candidatos</div>
                  </div>
                  <div class="stat" [class.stat-success]="s.seleccionados > 0">
                    <div class="stat-val">{{ s.seleccionados }}</div>
                    <div class="stat-lbl">Seleccionados</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Barra de progreso aprobación -->
            <div class="aprov-chain">
              <div class="aprov-node" [class.done]="s.Aprobado_Lider">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_Lider ? 'check' : 'schedule' }}</mat-icon>
                </div>
                <span>Líder</span>
              </div>
              <div class="aprov-arrow">›</div>
              <div class="aprov-node"
                [class.done]="s.Aprobado_DirAdm"
                [class.active]="s.Aprobado_Lider && !s.Aprobado_DirAdm && s.Estado_Aprobacion !== 'Rechazado'">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_DirAdm ? 'check' : 'schedule' }}</mat-icon>
                </div>
                <span>Dir. Adm</span>
              </div>
              <div class="aprov-arrow">›</div>
              <div class="aprov-node"
                [class.done]="s.Aprobado_Gerente"
                [class.active]="s.Aprobado_DirAdm && !s.Aprobado_Gerente && s.Estado_Aprobacion !== 'Rechazado'">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_Gerente ? 'check' : 'schedule' }}</mat-icon>
                </div>
                <span>Gerente</span>
              </div>

              <!-- Botón carta oferta solo si está aprobada y tiene seleccionados -->
              @if (s.Estado_Aprobacion === 'Aprobado' && s.seleccionados > 0) {
                <div style="margin-left:auto">
                  <button mat-flat-button color="primary" (click)="generarOferta(s)">
                    <mat-icon>description</mat-icon> Generar carta oferta
                  </button>
                </div>
              } @else if (s.Estado_Aprobacion === 'Aprobado' && s.seleccionados === 0) {
                <div style="margin-left:auto">
                  <span class="badge badge--warning">Esperando candidatos seleccionados</span>
                </div>
              }
            </div>

            <div class="progress-bar" style="margin-top:10px">
              <div
                class="fill"
                [class]="claseBarra(s)"
                [style.width.%]="(progreso(s) / 3) * 100">
              </div>
            </div>
          </div>
        }

        @if (solicitudes().length === 0) {
          <div class="empty-state">
            <mat-icon>assignment</mat-icon>
            <p>No tienes solicitudes registradas aún</p>
            <button mat-flat-button color="primary" (click)="nueva()">
              Crear primera solicitud
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .sol-card { margin-bottom: 12px; }
    .sol-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .sol-id     { font-size: 11px; color: #9BA8B5; }
    .sol-nombre { font-size: 15px; font-weight: 500; color: #1E3A5F; margin: 2px 0; }
    .sol-meta   { font-size: 12px; color: #9BA8B5; }
    .sol-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .sol-stats  { display: flex; gap: 8px; }
    .stat { text-align: center; padding: 6px 12px; background: #F4F6F9; border-radius: 8px; }
    .stat-val { font-size: 18px; font-weight: 500; color: #1E3A5F; }
    .stat-lbl { font-size: 10px; color: #9BA8B5; }
    .stat-success .stat-val { color: #3B6D11; }

    .aprov-chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .aprov-node  { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .aprov-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: #F4F6F9; border: 1.5px solid #D0D8E4;
      display: flex; align-items: center; justify-content: center;
    }
    .aprov-circle mat-icon { font-size: 16px; width: 16px; height: 16px; color: #9BA8B5; }
    .aprov-node span { font-size: 10px; color: #9BA8B5; }
    .aprov-node.done .aprov-circle  { background: #EAF3DE; border-color: #1D9E75; }
    .aprov-node.done .aprov-circle mat-icon { color: #1D9E75; }
    .aprov-node.active .aprov-circle { background: #E6F1FB; border-color: #378ADD; }
    .aprov-node.active .aprov-circle mat-icon { color: #378ADD; }
    .aprov-node.active span { color: #185FA5; font-weight: 500; }
    .aprov-arrow { color: #D0D8E4; font-size: 16px; margin-top: -12px; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
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
    this.solicitudesSvc.getAll().subscribe({
      next: async (solic) => {
        const resultado: SolicitudConCandidatos[] = [];
        for (const s of solic) {
          const candidatos = await this.candidatosSvc
            .getBySolicitud(s.Id).toPromise() ?? [];
          resultado.push({
            ...s,
            totalCandidatos: candidatos.length,
            seleccionados:   candidatos.filter(c => c.Estado === 'Seleccionado').length,
          });
        }
        this.solicitudes.set(resultado);
        this.cargando.set(false);
      },
      error: () => {
        this.notif.error('Error al cargar solicitudes');
        this.cargando.set(false);
      },
    });
  }

  nueva()               { this.router.navigate(['/lider/solicitudes/nueva']); }
  generarOferta(s: SolicitudItem) { this.router.navigate(['/lider/solicitudes', s.Id, 'oferta']); }

  progreso(s: SolicitudItem): number {
    return (s.Aprobado_Lider ? 1 : 0) + (s.Aprobado_DirAdm ? 1 : 0) + (s.Aprobado_Gerente ? 1 : 0);
  }

  claseBarra(s: SolicitudItem): string {
    if (s.Estado_Aprobacion === 'Aprobado')  return 'success';
    if (s.Estado_Aprobacion === 'Rechazado') return 'danger';
    if (this.progreso(s) === 0)              return 'warning';
    return 'info';
  }

  badgeEstado(e: EstadoAprobacion): string {
    return { Aprobado: 'success', Rechazado: 'danger', Pendiente: 'warning' }[e] ?? 'neutral';
  }
}