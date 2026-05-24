import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SolicitudesService, ParticipacionesService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import {
  SolicitudItem, EstadoAprobacion,
  ParticipacionItem, EstadoParticipacion,
} from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

interface SolicitudConParticipaciones extends SolicitudItem {
  participaciones: ParticipacionItem[];
  cargandoParticipaciones: boolean;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatExpansionModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Solicitudes</h2>
          <p class="subtitle">Pipeline de solicitudes y gestión de participantes</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por perfil o solicitante</mat-label>
          <input matInput [formControl]="ctrlBusqueda" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [formControl]="ctrlEstado">
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

        <mat-accordion multi>
          @for (s of solicitudesFiltradas(); track s.Id) {
            <mat-expansion-panel class="sol-panel"
              (opened)="cargarParticipaciones(s)">

              <mat-expansion-panel-header>
                <mat-panel-title>
                  <div class="panel-title">
                    <span class="sol-id">SOL-{{ s.Id }}</span>
                    <span class="sol-nombre">{{ s.Pefil_solicitado?.Cargo }}</span>
                    <span [class]="'badge badge--' + badgeEstado(s.Estado_Aprobacion)">
                      {{ s.Estado_Aprobacion }}
                    </span>
                  </div>
                </mat-panel-title>
                <mat-panel-description>
                  {{ s.AreaSolicitante?.Title }} ·
                  {{ s.Solicitante?.Title }} ·
                  {{ s.Created | date:'dd/MM/yyyy' }}
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="sol-detalle">

                <!-- Cadena de aprobación -->
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
                </div>

                <!-- Barra de progreso -->
                <div class="progress-bar">
                  <div class="fill" [class]="claseBarra(s)"
                    [style.width.%]="(progreso(s) / 3) * 100">
                  </div>
                </div>

                <!-- Info de la solicitud -->
                <div class="sol-info-grid">
                  <div class="info-item">
                    <span class="lbl">Motivo</span>
                    <span class="val">{{ s.MotivoVacante }}</span>
                  </div>
                  <div class="info-item">
                    <span class="lbl">Tipo contrato</span>
                    <span class="val">{{ s.TipoContrato }}</span>
                  </div>
                  <div class="info-item">
                    <span class="lbl">Fecha inicio requerida</span>
                    <span class="val">{{ s.FechaRequeridaInicio | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="lbl">Rango salarial</span>
                    <span class="val">$ {{ s.RangoSalario }} COP</span>
                  </div>
                  <div class="info-item">
                    <span class="lbl">Jefe inmediato</span>
                    <span class="val">{{ s.JefeInmediato }}</span>
                  </div>
                  <div class="info-item">
                    <span class="lbl">Centro de costos</span>
                    <span class="val">{{ s.CentroCosto?.Title }}</span>
                  </div>
                </div>

                <!-- Info del perfil del cargo -->
                @if (s.Pefil_solicitado?.Cargo) {
                  <div class="perfil-info">
                    <div class="perfil-info-title">
                      <mat-icon>work</mat-icon> Perfil del cargo
                    </div>
                    <div class="perfil-info-grid">
                      <div class="perfil-info-item">
                        <span class="perfil-lbl">Competencias requeridas</span>
                        <span class="perfil-val" id="comp-{{ s.Id }}">
                          {{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.ComptenciasRequeridas || '—' }}
                        </span>
                      </div>
                      <div class="perfil-info-item">
                        <span class="perfil-lbl">Formación y conocimiento</span>
                        <span class="perfil-val">
                          {{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.FormacionConocimiento || '—' }}
                        </span>
                      </div>
                    </div>
                  </div>
                }

                <!-- Documentos -->
                <div class="sol-docs">
                  <button mat-stroked-button color="primary" (click)="verDocumentos(s)">
                    <mat-icon>folder_open</mat-icon> Ver documentos adjuntos
                  </button>
                </div>

                <!-- Participaciones (solo si está aprobada) -->
                @if (s.Estado_Aprobacion === 'Aprobado') {
                  <mat-expansion-panel class="participaciones-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon style="margin-right:8px;font-size:18px;width:18px;height:18px">
                          people
                        </mat-icon>
                        Candidatos vinculados
                        @if (!s.cargandoParticipaciones) {
                          ({{ s.participaciones?.length ?? 0 }})
                        }
                      </mat-panel-title>
                    </mat-expansion-panel-header>

                    @if (s.cargandoParticipaciones) {
                      <div style="padding:16px;text-align:center">
                        <mat-spinner diameter="28" />
                      </div>
                    } @else {
                      <div class="participaciones-lista">
                        @for (p of s.participaciones; track p.Id) {
                          <div class="part-row">
                            <div class="part-avatar">
                              {{ iniciales(p.Candidato?.Title ?? '') }}
                            </div>
                            <div class="part-info">
                              <div class="part-nombre">{{ p.Candidato?.Title }}</div>
                              <div class="part-fecha">
                                Ingresó {{ p.Fecha_Ingreso | date:'dd/MM/yyyy' }}
                              </div>
                            </div>
                            <div class="part-badges">
                              <span [class]="'badge badge--' + badgeParticipacion(p.Estado)">
                                {{ p.Estado }}
                              </span>
                              @if (p.Examenes_OK) {
                                <span class="badge badge--success">Exámenes OK</span>
                              }
                            </div>
                            <div class="part-actions">
                              @if (p.Estado === 'Seleccionado') {
                                <button mat-stroked-button color="primary"
                                  matTooltip="Generar carta oferta"
                                  (click)="generarOferta(p)">
                                  <mat-icon>description</mat-icon> Carta oferta
                                </button>
                              }
                              <button mat-icon-button
                                matTooltip="Ver documentos de la participación"
                                (click)="verDocumentosParticipacion(p)">
                                <mat-icon>attach_file</mat-icon>
                              </button>
                            </div>
                          </div>
                        }

                        @if (s.participaciones?.length === 0) {
                          <p class="sin-candidatos">
                            No hay candidatos vinculados a esta solicitud aún.
                          </p>
                        }

                        <div class="vincular-btn">
                          <button mat-stroked-button (click)="vincularCandidato(s)">
                            <mat-icon>person_add</mat-icon> Vincular candidato
                          </button>
                        </div>
                      </div>
                    }
                  </mat-expansion-panel>
                }

              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

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
    .filtros-bar  { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .results-info { font-size: 12px; color: #9BA8B5; margin-bottom: 8px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .sol-panel { margin-bottom: 8px; border-radius: var(--radius-lg) !important; }
    .panel-title { display: flex; align-items: center; gap: 10px; }
    .sol-id     { font-size: 11px; color: #9BA8B5; }
    .sol-nombre { font-size: 14px; font-weight: 500; color: #1E3A5F; }

    .sol-detalle { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; }

    .aprov-chain { display: flex; align-items: center; gap: 8px; }
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

    .sol-info-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
      background: #F4F6F9; border-radius: 8px; padding: 12px;
    }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 10px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 12px; font-weight: 500; color: #1E3A5F; }

    .perfil-info {
      border: 0.5px solid #B5D4F4; border-radius: 8px; padding: 12px 14px;
    }
    .perfil-info-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 500; color: #185FA5;
      margin-bottom: 10px;
    }
    .perfil-info-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .perfil-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .perfil-info-item { display: flex; flex-direction: column; gap: 3px; }
    .perfil-lbl {
      font-size: 10px; color: #185FA5;
      text-transform: uppercase; letter-spacing: .04em; font-weight: 500;
    }
    .perfil-val { font-size: 12px; color: #1E3A5F; white-space: pre-wrap; }

    .sol-docs { padding-top: 2px; }

    .participaciones-panel {
      border: 0.5px solid #D0D8E4 !important;
      border-radius: 8px !important;
      box-shadow: none !important;
    }
    .participaciones-lista { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
    .part-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px; background: #F4F6F9;
    }
    .part-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .part-info   { flex: 1; }
    .part-nombre { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .part-fecha  { font-size: 11px; color: #9BA8B5; }
    .part-badges { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
    .part-actions { display: flex; gap: 4px; align-items: center; }
    .sin-candidatos { font-size: 13px; color: #9BA8B5; text-align: center; padding: 12px; margin: 0; }
    .vincular-btn { padding-top: 8px; border-top: 0.5px solid #EEF1F5; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class SolicitudesComponent implements OnInit {
  private solicitudesSvc   = inject(SolicitudesService);
  private participacionSvc = inject(ParticipacionesService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private viewer           = inject(DocumentViewerService);

  solicitudes  = signal<SolicitudConParticipaciones[]>([]);
  cargando     = signal(true);

  // FormControls para los filtros — toSignal los convierte en signals reactivos
  ctrlBusqueda = new FormControl('');
  ctrlEstado   = new FormControl('');

  private busquedaSignal = toSignal(this.ctrlBusqueda.valueChanges, { initialValue: '' });
  private estadoSignal   = toSignal(this.ctrlEstado.valueChanges,   { initialValue: '' });

  // Mapa de perfiles cargados para mostrar competencias y formación
  perfilInfoMap: Record<number, { ComptenciasRequeridas: string; FormacionConocimiento: string }> = {};

  solicitudesFiltradas = computed(() => {
    const texto  = (this.busquedaSignal() ?? '').toLowerCase();
    const estado = (this.estadoSignal() ?? '') as EstadoAprobacion | '';
    return this.solicitudes().filter(s => {
      const matchTexto = !texto ||
        s.Pefil_solicitado?.Cargo?.toLowerCase().includes(texto) ||
        s.Solicitante?.Title?.toLowerCase().includes(texto) ||
        s.AreaSolicitante?.Title?.toLowerCase().includes(texto);
      const matchEstado = !estado || s.Estado_Aprobacion === estado;
      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.solicitudesSvc.getAll().subscribe({
      next: s => {
        this.solicitudes.set(s.map(sol => ({
          ...sol,
          participaciones: [],
          cargandoParticipaciones: false,
        })));
        // Construye el mapa de info de perfiles para mostrar en la vista
        s.forEach(sol => {
          if (sol.Pefil_solicitado?.Id) {
            this.perfilInfoMap[sol.Pefil_solicitado.Id] = {
              ComptenciasRequeridas: (sol.Pefil_solicitado as any).ComptenciasRequeridas ?? '',
              FormacionConocimiento: (sol.Pefil_solicitado as any).FormacionConocimiento ?? '',
            };
          }
        });
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar solicitudes'); this.cargando.set(false); },
    });
  }

  cargarParticipaciones(s: SolicitudConParticipaciones) {
    if (s.Estado_Aprobacion !== 'Aprobado') return;
    if (s.participaciones.length > 0)       return;

    this.solicitudes.update(lista =>
      lista.map(item => item.Id === s.Id
        ? { ...item, cargandoParticipaciones: true } : item)
    );

    this.participacionSvc.getBySolicitud(s.Id).subscribe({
      next: partic => {
        this.solicitudes.update(lista =>
          lista.map(item => item.Id === s.Id
            ? { ...item, participaciones: partic, cargandoParticipaciones: false } : item)
        );
      },
      error: () => {
        this.notif.error('Error al cargar candidatos');
        this.solicitudes.update(lista =>
          lista.map(item => item.Id === s.Id
            ? { ...item, cargandoParticipaciones: false } : item)
        );
      },
    });
  }

  vincularCandidato(s: SolicitudItem) {
    this.router.navigate(['/analista/participaciones/nueva'], {
      queryParams: { solicitudId: s.Id },
    });
  }

  generarOferta(p: ParticipacionItem) {
    this.router.navigate(['/analista/participaciones', p.Id, 'oferta']);
  }

  verDocumentos(s: SolicitudItem) {
    this.viewer.abrir(
      `SOL-${s.Id} · ${s.Pefil_solicitado?.Cargo}`,
      SP_LISTS.SOLICITUDES, s.Id
    );
  }

  verDocumentosParticipacion(p: ParticipacionItem) {
    this.viewer.abrir(
      `Participación: ${p.Candidato?.Title}`,
      SP_LISTS.PARTICIPACIONES, p.Id
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

  badgeParticipacion(e: EstadoParticipacion): string {
    return { 'En proceso': 'primary', 'Seleccionado': 'success', 'Descartado': 'neutral' }[e] ?? 'neutral';
  }

  iniciales(n: string): string {
    const p = n.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  }
}