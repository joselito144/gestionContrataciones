import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SolicitudesService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudItem, EstadoAprobacion } from '../../../shared/models';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Solicitudes</h2>
          <p class="subtitle">Pipeline de solicitudes de perfil en curso</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por perfil o solicitante</mat-label>
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
        <p class="results-info">{{ solicitudesFiltradas().length }} solicitudes</p>

        @for (s of solicitudesFiltradas(); track s.Id) {
          <div class="sol-card card">
            <div class="sol-card-header">
              <div>
                <div class="sol-id">SOL-{{ s.Id }}</div>
                <div class="sol-nombre">{{ s.Perfil_Solicitado }}</div>
                <div class="sol-meta">
                  {{ s.Solicitante?.Title }} · {{ s.AreaSolicitante?.Title }} ·
                  <span class="badge badge--neutral">{{ s.MotivoVacante }}</span>
                </div>
              </div>
              <div class="sol-right">
                <span [class]="'badge badge--' + badgeEstado(s.Estado_Aprobacion)">
                  {{ s.Estado_Aprobacion }}
                </span>
                <div class="sol-fecha">{{ s.Fecha_Solicitud | date:'dd/MM/yyyy' }}</div>
              </div>
            </div>

            <!-- Cadena de aprobación -->
            <div class="aprov-chain">
              <div class="aprov-node" [class.done]="s.Aprobado_Lider" [class.active]="!s.Aprobado_Lider && s.Estado_Aprobacion === 'Pendiente'">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_Lider ? 'check' : (s.Estado_Aprobacion === 'Rechazado' && !s.Aprobado_Lider ? 'close' : 'schedule') }}</mat-icon>
                </div>
                <span>Líder</span>
              </div>
              <div class="aprov-arrow">›</div>
              <div class="aprov-node" [class.done]="s.Aprobado_DirAdm" [class.active]="s.Aprobado_Lider && !s.Aprobado_DirAdm && s.Estado_Aprobacion !== 'Rechazado'">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_DirAdm ? 'check' : 'schedule' }}</mat-icon>
                </div>
                <span>Dir. Adm</span>
              </div>
              <div class="aprov-arrow">›</div>
              <div class="aprov-node" [class.done]="s.Aprobado_Gerente" [class.active]="s.Aprobado_DirAdm && !s.Aprobado_Gerente && s.Estado_Aprobacion !== 'Rechazado'">
                <div class="aprov-circle">
                  <mat-icon>{{ s.Aprobado_Gerente ? 'check' : 'schedule' }}</mat-icon>
                </div>
                <span>Gerente</span>
              </div>
              <div style="flex:1"></div>
              @if (s.Estado_Aprobacion === 'Aprobado') {
                <span class="badge badge--success">Lista para gestión de candidatos</span>
              }
            </div>

            <!-- Barra de progreso -->
            <div class="progress-bar" style="margin-top: 10px;">
              <div class="fill" [class]="claseBarra(s)" [style.width.%]="(progreso(s) / 3) * 100"></div>
            </div>
          </div>
        }

        @if (solicitudesFiltradas().length === 0) {
          <div class="empty-state">
            <mat-icon>assignment</mat-icon>
            <p>No hay solicitudes con los filtros aplicados</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filtros-bar { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .results-info { font-size: 12px; color: #9BA8B5; margin-bottom: 8px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .sol-card { cursor: default; }
    .sol-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .sol-id    { font-size: 11px; color: #9BA8B5; }
    .sol-nombre { font-size: 14px; font-weight: 500; color: #1E3A5F; margin: 2px 0; }
    .sol-meta  { font-size: 12px; color: #9BA8B5; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .sol-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .sol-fecha { font-size: 11px; color: #9BA8B5; }

    .aprov-chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .aprov-node  { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .aprov-circle { width: 32px; height: 32px; border-radius: 50%; background: #F4F6F9; border: 1.5px solid #D0D8E4; display: flex; align-items: center; justify-content: center; }
    .aprov-circle mat-icon { font-size: 16px; width: 16px; height: 16px; color: #9BA8B5; }
    .aprov-node span { font-size: 10px; color: #9BA8B5; }
    .aprov-node.done .aprov-circle { background: #EAF3DE; border-color: #1D9E75; }
    .aprov-node.done .aprov-circle mat-icon { color: #1D9E75; }
    .aprov-node.active .aprov-circle { background: #E6F1FB; border-color: #378ADD; }
    .aprov-node.active .aprov-circle mat-icon { color: #378ADD; }
    .aprov-node.active span { color: #185FA5; font-weight: 500; }
    .aprov-arrow { color: #D0D8E4; font-size: 16px; margin-top: -12px; }

    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class SolicitudesComponent implements OnInit {
  private svc   = inject(SolicitudesService);
  private notif = inject(NotificacionService);

  solicitudes  = signal<SolicitudItem[]>([]);
  cargando     = signal(true);
  textoBusqueda = '';
  filtroEstado  = '';

  solicitudesFiltradas = computed(() => {
    const texto = this.textoBusqueda.toLowerCase();
    const estado = this.filtroEstado as EstadoAprobacion | '';
    return this.solicitudes().filter(s => {
      const coincideTexto = !texto ||
        s.Perfil_Solicitado.toLowerCase().includes(texto) ||
        s.Solicitante?.Title?.toLowerCase().includes(texto);
      const coincideEstado = !estado || s.Estado_Aprobacion === estado;
      return coincideTexto && coincideEstado;
    });
  });

  ngOnInit() {
    this.svc.getAll().subscribe({
      next:  s => { this.solicitudes.set(s); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar solicitudes'); this.cargando.set(false); },
    });
  }

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
