import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SolicitudesService,
  ParticipacionesService,
  PerfilesCargosService,
  OfertasService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import {
  SolicitudItem, EstadoAprobacion,
  ParticipacionItem, EstadoParticipacion,
  PerfilCargoItem, OfertaItem,
} from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

interface ParticipacionConOferta extends ParticipacionItem {
  oferta?: OfertaItem;
}

interface SolicitudConParticipaciones extends SolicitudItem {
  participaciones: ParticipacionConOferta[];
  cargandoParticipaciones: boolean;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
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
            <mat-expansion-panel class="sol-panel" (opened)="onPanelAbierto(s)">

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

                <div class="aprov-chain">
                  <div class="aprov-node"
                    [class.done]="s.Aprobado_DirAdm"
                    [class.active]="!s.Aprobado_DirAdm && s.Estado_Aprobacion === 'Pendiente'">
                    <div class="aprov-circle"><mat-icon>{{ s.Aprobado_DirAdm ? 'check' : 'schedule' }}</mat-icon></div>
                    <span>Dir. Administrativo</span>
                  </div>
                  <div class="aprov-arrow">›</div>
                  <div class="aprov-node"
                    [class.done]="s.Aprobado_Gerente"
                    [class.active]="s.Aprobado_DirAdm && !s.Aprobado_Gerente && s.Estado_Aprobacion !== 'Rechazado'">
                    <div class="aprov-circle"><mat-icon>{{ s.Aprobado_Gerente ? 'check' : 'schedule' }}</mat-icon></div>
                    <span>Gerente</span>
                  </div>
                </div>

                <div class="progress-bar">
                  <div class="fill" [class]="claseBarra(s)" [style.width.%]="(progreso(s) / 2) * 100"></div>
                </div>

                <div class="sol-info-grid">
                  <div class="info-item"><span class="lbl">Solicitante</span><span class="val">{{ s.Solicitante?.Title }}</span></div>
                  <div class="info-item"><span class="lbl">Área</span><span class="val">{{ s.AreaSolicitante?.Title }}</span></div>
                  <div class="info-item"><span class="lbl">Centro de costos</span><span class="val">{{ s.CentroCosto?.Title }}</span></div>
                  <div class="info-item"><span class="lbl">Motivo vacante</span><span class="val">{{ s.MotivoVacante }}</span></div>
                  <div class="info-item"><span class="lbl">Jefe inmediato</span><span class="val">{{ s.JefeInmediato }}</span></div>
                  <div class="info-item"><span class="lbl">Fecha inicio requerida</span><span class="val">{{ s.FechaRequeridaInicio | date:'dd/MM/yyyy' }}</span></div>
                  <div class="info-item"><span class="lbl">Rango salarial</span><span class="val">$ {{ s.RangoSalario }} COP</span></div>
                  <div class="info-item"><span class="lbl">Tipo contrato</span><span class="val">{{ s.TipoContrato }}</span></div>
                  <div class="info-item">
                    <span class="lbl">Duración</span>
                    <span class="val">
                      @if (s.TipoContrato !== 'Término Indefinido' && s.DuracionContrato) {
                        {{ s.DuracionContrato }} {{ s.UnidadDuracionContrato }}
                      } @else { Indefinido }
                    </span>
                  </div>
                  <div class="info-item"><span class="lbl">Prueba de Excel</span><span class="val">{{ s.PruebaExcel }}</span></div>
                  <div class="info-item"><span class="lbl">Trabajo en alturas</span><span class="val">{{ s.TrabajoAlturasVigente ? 'Sí requerido' : 'No requerido' }}</span></div>
                  @if (s.DefinicionObjetoObra) {
                    <div class="info-item full"><span class="lbl">Definición objeto / obra</span><span class="val">{{ s.DefinicionObjetoObra }}</span></div>
                  }
                  @if (s.ElementosNecesarios) {
                    <div class="info-item full"><span class="lbl">Elementos necesarios</span><span class="val">{{ s.ElementosNecesarios }}</span></div>
                  }
                </div>

                <div class="perfil-info">
                  <div class="perfil-info-title"><mat-icon>work</mat-icon> Perfil del cargo</div>
                  @if (perfilInfoMap[s.Pefil_solicitado?.Id ?? 0]) {
                    <div class="perfil-info-grid">
                      <div class="perfil-info-item">
                        <span class="perfil-lbl">Experiencia mínima</span>
                        <span class="perfil-val">
                          {{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.ExperienciaMinima }}
                          {{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.ExperienciaMinima === 1 ? 'año' : 'años' }}
                        </span>
                      </div>
                      <div class="perfil-info-item">
                        <span class="perfil-lbl">Competencias requeridas</span>
                        <span class="perfil-val">{{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.ComptenciasRequeridas || '—' }}</span>
                      </div>
                      <div class="perfil-info-item">
                        <span class="perfil-lbl">Formación y conocimiento</span>
                        <span class="perfil-val">{{ perfilInfoMap[s.Pefil_solicitado!.Id!]?.FormacionConocimiento || '—' }}</span>
                      </div>
                    </div>
                  } @else {
                    <div style="font-size:12px;color:#9BA8B5;padding:4px 0">
                      <mat-spinner diameter="16" style="display:inline-block;vertical-align:middle;margin-right:6px" />
                      Cargando información del perfil...
                    </div>
                  }
                  @if (s.AmpliarPerfilCargo) {
                    <div class="perfil-ampliar">
                      <span class="perfil-lbl">Información adicional del solicitante</span>
                      <span class="perfil-val">{{ s.AmpliarPerfilCargo }}</span>
                    </div>
                  }
                </div>

                <div class="sol-docs">
                  <button mat-stroked-button color="primary" (click)="verDocumentos(s)">
                    <mat-icon>folder_open</mat-icon> Ver documentos adjuntos
                  </button>
                </div>

                @if (s.Estado_Aprobacion === 'Aprobado') {
                  <mat-expansion-panel class="participaciones-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon style="margin-right:8px;font-size:18px;width:18px;height:18px">people</mat-icon>
                        Candidatos vinculados
                        @if (!s.cargandoParticipaciones) { ({{ s.participaciones?.length ?? 0 }}) }
                      </mat-panel-title>
                    </mat-expansion-panel-header>

                    @if (s.cargandoParticipaciones) {
                      <div style="padding:16px;text-align:center"><mat-spinner diameter="28" /></div>
                    } @else {
                      <div class="participaciones-lista">
                        @for (p of s.participaciones; track p.Id) {
                          <div class="part-row">
                            <div class="part-avatar">{{ iniciales(nombreCandidato(p)) }}</div>
                            <div class="part-info">
                              <div class="part-nombre">{{ nombreCandidato(p) }}</div>
                              <div class="part-fecha">Ingresó {{ p.Fecha_Ingreso | date:'dd/MM/yyyy' }}</div>
                            </div>
                            <div class="part-badges">
                              <span [class]="'badge badge--' + badgeParticipacion(p.Estado)">{{ p.Estado }}</span>
                              @if (p.Examenes_OK) { <span class="badge badge--success">Exámenes OK</span> }
                              <!-- Estado de oferta -->
                              @if (p.oferta) {
                                <span [class]="'badge badge--' + badgeOferta(p.oferta.Estado_Oferta)">
                                  Oferta: {{ p.oferta.Estado_Oferta }}
                                </span>
                              }
                            </div>
                            <div class="part-actions">
                              <!-- Si ya tiene oferta, solo "Ver oferta". Si no, y está Seleccionado, "Carta oferta" -->
                              @if (p.oferta) {
                                <button mat-stroked-button color="primary"
                                  matTooltip="Ver detalle de la oferta enviada"
                                  (click)="verOferta(p.oferta)">
                                  <mat-icon>visibility</mat-icon> Ver oferta
                                </button>
                              } @else if (p.Estado === 'Seleccionado') {
                                <button mat-stroked-button color="primary"
                                  matTooltip="Generar carta oferta"
                                  (click)="generarOferta(p)">
                                  <mat-icon>description</mat-icon> Carta oferta
                                </button>
                              }
                              <button mat-icon-button color="primary"
                                matTooltip="Ver hoja de vida del candidato"
                                (click)="verHojaDeVida(p)">
                                <mat-icon>description</mat-icon>
                              </button>
                              <button mat-icon-button
                                matTooltip="Ver documentos de la participación"
                                (click)="verDocumentosParticipacion(p)">
                                <mat-icon>attach_file</mat-icon>
                              </button>
                            </div>
                          </div>
                        }

                        @if (s.participaciones?.length === 0) {
                          <p class="sin-candidatos">No hay candidatos vinculados a esta solicitud aún.</p>
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
    .info-item.full { grid-column: 1 / -1; }
    .lbl { font-size: 10px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 12px; font-weight: 500; color: #1E3A5F; }
    .perfil-info { border: 0.5px solid #B5D4F4; border-radius: 8px; padding: 12px 14px; }
    .perfil-info-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #185FA5; margin-bottom: 10px; }
    .perfil-info-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .perfil-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .perfil-info-item { display: flex; flex-direction: column; gap: 3px; }
    .perfil-lbl { font-size: 10px; color: #185FA5; text-transform: uppercase; letter-spacing: .04em; font-weight: 500; }
    .perfil-val { font-size: 12px; color: #1E3A5F; white-space: pre-wrap; }
    .perfil-ampliar { margin-top: 10px; padding-top: 10px; border-top: 0.5px solid #B5D4F4; display: flex; flex-direction: column; gap: 3px; }
    .sol-docs { padding-top: 2px; }
    .participaciones-panel { border: 0.5px solid #D0D8E4 !important; border-radius: 8px !important; box-shadow: none !important; }
    .participaciones-lista { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
    .part-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #F4F6F9; }
    .part-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 500; color: #fff; flex-shrink: 0;
    }
    .part-info   { flex: 1; }
    .part-nombre { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .part-fecha  { font-size: 11px; color: #9BA8B5; }
    .part-badges { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
    .part-actions { display: flex; gap: 4px; align-items: center; }
    .sin-candidatos { font-size: 13px; color: #9BA8B5; text-align: center; padding: 12px; margin: 0; }
    .vincular-btn { padding-top: 8px; border-top: 0.5px solid #EEF1F5; }
    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class SolicitudesComponent implements OnInit {
  private solicitudesSvc   = inject(SolicitudesService);
  private participacionSvc = inject(ParticipacionesService);
  private perfilesSvc      = inject(PerfilesCargosService);
  private ofertasSvc       = inject(OfertasService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private viewer           = inject(DocumentViewerService);

  solicitudes = signal<SolicitudConParticipaciones[]>([]);
  cargando    = signal(true);

  ctrlBusqueda = new FormControl('');
  ctrlEstado   = new FormControl('');
  private busquedaSignal = toSignal(this.ctrlBusqueda.valueChanges, { initialValue: '' });
  private estadoSignal   = toSignal(this.ctrlEstado.valueChanges,   { initialValue: '' });

  perfilInfoMap: Record<number, PerfilCargoItem> = {};

  solicitudesFiltradas = computed(() => {
    const texto  = (this.busquedaSignal() ?? '').toLowerCase();
    const estado = (this.estadoSignal() ?? '') as EstadoAprobacion | '';
    return this.solicitudes().filter(s => {
      const t = !texto ||
        s.Pefil_solicitado?.Cargo?.toLowerCase().includes(texto) ||
        s.Solicitante?.Title?.toLowerCase().includes(texto) ||
        s.AreaSolicitante?.Title?.toLowerCase().includes(texto);
      const e = !estado || s.Estado_Aprobacion === estado;
      return t && e;
    });
  });

  ngOnInit() {
    this.solicitudesSvc.getAll().subscribe({
      next: s => {
        this.solicitudes.set(s.map(sol => ({
          ...sol, participaciones: [], cargandoParticipaciones: false,
        })));
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar solicitudes'); this.cargando.set(false); },
    });
  }

  onPanelAbierto(s: SolicitudConParticipaciones) {
    this.cargarParticipaciones(s);
    this.cargarInfoPerfil(s);
  }

  cargarParticipaciones(s: SolicitudConParticipaciones) {
    if (s.Estado_Aprobacion !== 'Aprobado') return;
    if (s.participaciones.length > 0)       return;

    this.solicitudes.update(lista =>
      lista.map(item => item.Id === s.Id ? { ...item, cargandoParticipaciones: true } : item)
    );

    this.participacionSvc.getBySolicitud(s.Id).subscribe({
      next: partic => {
        if (partic.length === 0) {
          this.solicitudes.update(lista =>
            lista.map(item => item.Id === s.Id
              ? { ...item, participaciones: [], cargandoParticipaciones: false } : item)
          );
          return;
        }

        // Carga las ofertas de todas las participaciones en una sola consulta
        const ids = partic.map(p => p.Id);
        this.ofertasSvc.getByParticipaciones(ids).subscribe({
          next: ofertas => {
            const enriquecidas: ParticipacionConOferta[] = partic.map(p => ({
              ...p,
              oferta: ofertas.find(o =>
                (o.ID_Participacion?.Id ?? o.ID_ParticipacionId) === p.Id
              ),
            }));
            this.solicitudes.update(lista =>
              lista.map(item => item.Id === s.Id
                ? { ...item, participaciones: enriquecidas, cargandoParticipaciones: false } : item)
            );
          },
          error: () => {
            // Si falla cargar ofertas, igual muestra las participaciones sin ese dato
            this.solicitudes.update(lista =>
              lista.map(item => item.Id === s.Id
                ? { ...item, participaciones: partic, cargandoParticipaciones: false } : item)
            );
          },
        });
      },
      error: () => {
        this.notif.error('Error al cargar candidatos');
        this.solicitudes.update(lista =>
          lista.map(item => item.Id === s.Id ? { ...item, cargandoParticipaciones: false } : item)
        );
      },
    });
  }

  cargarInfoPerfil(s: SolicitudConParticipaciones) {
    const perfilId = s.Pefil_solicitado?.Id;
    if (!perfilId || this.perfilInfoMap[perfilId]) return;

    this.perfilesSvc.getById(perfilId).subscribe({
      next: perfil => {
        this.perfilInfoMap[perfilId] = perfil;
        this.solicitudes.update(lista => [...lista]);
      },
      error: () => {},
    });
  }

  nombreCandidato(p: ParticipacionItem): string {
    const c = p.Candidato as any;
    return c?.Nombre_Completo || c?.Title || '(sin nombre)';
  }

  vincularCandidato(s: SolicitudItem) {
    this.router.navigate(['/analista/participaciones/nueva'], { queryParams: { solicitudId: s.Id } });
  }

  generarOferta(p: ParticipacionItem) {
    this.router.navigate(['/analista/participaciones', p.Id, 'oferta']);
  }

  verOferta(oferta: OfertaItem) {
    this.router.navigate(['/analista/ofertas', oferta.Id]);
  }

  verDocumentos(s: SolicitudItem) {
    this.viewer.abrir(`SOL-${s.Id} · ${s.Pefil_solicitado?.Cargo}`, SP_LISTS.SOLICITUDES, s.Id);
  }

  verDocumentosParticipacion(p: ParticipacionItem) {
    this.viewer.abrir(`Proceso: ${this.nombreCandidato(p)}`, SP_LISTS.PARTICIPACIONES, p.Id);
  }

  // Abre el visor apuntando a la lista Candidatos, donde queda adjunta la hoja
  // de vida cargada desde candidato-form.component.ts
  verHojaDeVida(p: ParticipacionItem) {
    const candidatoId = p.CandidatoId ?? p.Candidato?.Id;
    if (!candidatoId) {
      this.notif.advertencia('No se pudo identificar el candidato para mostrar su hoja de vida');
      return;
    }
    this.viewer.abrir(`Hoja de vida: ${this.nombreCandidato(p)}`, SP_LISTS.CANDIDATOS, candidatoId);
  }

  progreso(s: SolicitudItem): number {
    return (s.Aprobado_DirAdm ? 1 : 0) + (s.Aprobado_Gerente ? 1 : 0);
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

  badgeOferta(e: string): string {
    return { Enviada: 'warning', Aceptada: 'success', Rechazada: 'danger', Vencida: 'neutral' }[e] ?? 'neutral';
  }

  iniciales(n: string): string {
    const p = (n ?? '').trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n ?? '??').substring(0, 2).toUpperCase();
  }
}