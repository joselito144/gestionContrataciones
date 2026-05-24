import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SolicitudesService, ParticipacionesService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import { SolicitudItem, EstadoAprobacion, ParticipacionItem } from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

interface SolicitudConResumen extends SolicitudItem {
  totalParticipaciones: number;
  seleccionados: number;
  cargado: boolean;
}

@Component({
  selector: 'app-lider-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Mis solicitudes</h2>
          <p class="subtitle">Solicitudes de personal registradas</p>
        </div>
        <button mat-flat-button color="primary" (click)="nueva()">
          <mat-icon>add</mat-icon> Nueva solicitud
        </button>
      </div>

      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar</mat-label>
          <input matInput [(ngModel)]="textoBusqueda" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filtroEstado">
            <mat-option value="">Todos</mat-option>
            <mat-option value="Pendiente">Pendiente</mat-option>
            <mat-option value="Aprobado">Aprobado</mat-option>
            <mat-option value="Rechazado">Rechazado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        @for (s of solicitudesFiltradas(); track s.Id) {
          <div class="sol-card card">
            <div class="sol-header">
              <div>
                <div class="sol-id">SOL-{{ s.Id }}</div>
                <div class="sol-nombre">{{ s.Pefil_solicitado?.Cargo }}</div>
                <div class="sol-meta">
                  {{ s.AreaSolicitante?.Title }} ·
                  {{ s.MotivoVacante }} ·
                  Inicio requerido: {{ s.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
                </div>
              </div>
              <div class="sol-right">
                <span [class]="'badge badge--' + badgeEstado(s.Estado_Aprobacion)">
                  {{ s.Estado_Aprobacion }}
                </span>
                @if (s.cargado) {
                  <div class="sol-stats">
                    <div class="stat">
                      <div class="stat-val">{{ s.totalParticipaciones }}</div>
                      <div class="stat-lbl">Candidatos</div>
                    </div>
                    <div class="stat" [class.stat-success]="s.seleccionados > 0">
                      <div class="stat-val">{{ s.seleccionados }}</div>
                      <div class="stat-lbl">Seleccionados</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Cadena aprobación -->
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

              @if (s.Estado_Aprobacion === 'Aprobado') {
                <span class="badge badge--success" style="margin-left:auto">
                  <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">check_circle</mat-icon>
                  En proceso de selección (Analista TH)
                </span>
              }
            </div>

            <!-- Barra progreso -->
            <div class="progress-bar">
              <div class="fill" [class]="claseBarra(s)"
                [style.width.%]="(progreso(s) / 3) * 100">
              </div>
            </div>

            <!-- Documentos adjuntos -->
            <div class="sol-footer">
              <button mat-stroked-button (click)="verDocumentos(s)">
                <mat-icon>folder_open</mat-icon> Ver documentos
              </button>
              <span class="sol-fecha">
                Creada el {{ s.Created | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
        }

        @if (solicitudesFiltradas().length === 0) {
          <div class="empty-state">
            <mat-icon>assignment</mat-icon>
            <p>No hay solicitudes registradas aún</p>
            <button mat-flat-button color="primary" (click)="nueva()">
              Crear primera solicitud
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filtros-bar  { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 180px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .sol-card { margin-bottom: 10px; display: flex; flex-direction: column; gap: 12px; }
    .sol-header { display: flex; align-items: flex-start; justify-content: space-between; }
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
      width: 30px; height: 30px; border-radius: 50%;
      background: #F4F6F9; border: 1.5px solid #D0D8E4;
      display: flex; align-items: center; justify-content: center;
    }
    .aprov-circle mat-icon { font-size: 15px; width: 15px; height: 15px; color: #9BA8B5; }
    .aprov-node span { font-size: 10px; color: #9BA8B5; }
    .aprov-node.done .aprov-circle  { background: #EAF3DE; border-color: #1D9E75; }
    .aprov-node.done .aprov-circle mat-icon { color: #1D9E75; }
    .aprov-node.active .aprov-circle { background: #E6F1FB; border-color: #378ADD; }
    .aprov-node.active .aprov-circle mat-icon { color: #378ADD; }
    .aprov-arrow { color: #D0D8E4; font-size: 14px; margin-top: -12px; }

    .sol-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 8px; border-top: 0.5px solid #EEF1F5;
    }
    .sol-fecha { font-size: 11px; color: #9BA8B5; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class LiderSolicitudesComponent implements OnInit {
  private solicitudesSvc   = inject(SolicitudesService);
  private participacionSvc = inject(ParticipacionesService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private viewer           = inject(DocumentViewerService);

  solicitudes  = signal<SolicitudConResumen[]>([]);
  cargando     = signal(true);
  textoBusqueda = '';
  filtroEstado  = '';

  solicitudesFiltradas = computed(() => {
    const t = this.textoBusqueda.toLowerCase();
    const e = this.filtroEstado as EstadoAprobacion | '';
    return this.solicitudes().filter(s => {
      const matchTexto = !t ||
        s.Pefil_solicitado?.Cargo?.toLowerCase().includes(t) ||
        s.AreaSolicitante?.Title?.toLowerCase().includes(t);
      const matchEstado = !e || s.Estado_Aprobacion === e;
      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.solicitudesSvc.getAll().subscribe({
      next: async solic => {
        const resultado: SolicitudConResumen[] = [];
        for (const s of solic) {
          let total = 0; let sel = 0;
          if (s.Estado_Aprobacion === 'Aprobado') {
            try {
              const parts = await this.participacionSvc
                .getBySolicitud(s.Id).toPromise() ?? [];
              total = parts.length;
              sel   = parts.filter((p: any) => p.Estado === 'Seleccionado').length;
            } catch {}
          }
          resultado.push({ ...s, totalParticipaciones: total, seleccionados: sel, cargado: true });
        }
        this.solicitudes.set(resultado);
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar solicitudes'); this.cargando.set(false); },
    });
  }

  nueva() { this.router.navigate(['/lider/solicitudes/nueva']); }

  verDocumentos(s: SolicitudItem) {
    this.viewer.abrir(
      `SOL-${s.Id} · ${s.Pefil_solicitado?.Cargo}`,
      SP_LISTS.SOLICITUDES,
      s.Id
    );
  }

  progreso(s: SolicitudItem): number {
    return (s.Aprobado_Lider ? 1 : 0) + (s.Aprobado_DirAdm ? 1 : 0) + (s.Aprobado_Gerente ? 1 : 0);
  }

  claseBarra(s: SolicitudItem): string {
    if (s.Estado_Aprobacion === 'Aprobado')  return 'success';
    if (s.Estado_Aprobacion === 'Rechazado') return 'danger';
    return this.progreso(s) === 0 ? 'warning' : 'info';
  }

  badgeEstado(e: EstadoAprobacion): string {
    return { Aprobado: 'success', Rechazado: 'danger', Pendiente: 'warning' }[e] ?? 'neutral';
  }
}