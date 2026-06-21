import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import {
    OfertasService,
    ParticipacionesService,
    SolicitudesService,
    CandidatosService,
} from '../../../core/services/domain';
import { KpiOfertasService } from '../../../core/services/domain/kpi-ofertas.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import {
    OfertaItem, ParticipacionItem, SolicitudItem, CandidatoItem, KpiOfertaItem,
} from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

@Component({
    selector: 'app-oferta-detalle',
    standalone: true,
    imports: [
        CommonModule, MatButtonModule, MatIconModule,
        MatProgressSpinnerModule, MatTooltipModule,
    ],
    template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>Carta oferta — OF-{{ oferta()?.Id }}</h2>
            @if (candidato()) {
              <p class="subtitle">{{ candidato()!.Nombre_Completo }}</p>
            }
          </div>
        </div>
        @if (oferta()) {
          <span [class]="'badge badge--' + badgeEstado(oferta()!.Estado_Oferta)">
            {{ oferta()!.Estado_Oferta }}
          </span>
        }
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (!oferta()) {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se encontró la oferta solicitada</p>
        </div>
      } @else {

        <!-- Resumen candidato y solicitud -->
        <div class="card resumen-card">
          <p class="section-title">Información del proceso</p>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="lbl">Candidato</span>
              <span class="val">{{ candidato()?.Nombre_Completo }}</span>
              <span class="sub">{{ candidato()?.TipoIdentificacion }} {{ candidato()?.NumeroIdentificacion }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Correo</span>
              <span class="val">{{ candidato()?.Correo }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Cargo solicitado</span>
              <span class="val">{{ solicitud()?.Pefil_solicitado?.Cargo }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Área</span>
              <span class="val">{{ solicitud()?.AreaSolicitante?.Title }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Solicitud</span>
              <span class="val">SOL-{{ solicitud()?.Id }}</span>
            </div>
          </div>
        </div>

        <!-- Condiciones ofertadas -->
        <div class="card">
          <p class="section-title">Condiciones ofertadas</p>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="lbl">Cargo ofertado</span>
              <span class="val">{{ oferta()!.Cargo }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Salario mensual</span>
              <span class="val">$ {{ oferta()!.Salario_Ofertado | number }} COP</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Aprobada Dir. Administrativo</span>
              <span class="val">
                @if (oferta()!.Aprobada_DirAdm) {
                  <mat-icon class="icon-ok">check_circle</mat-icon> Sí
                } @else {
                  <mat-icon class="icon-pending">schedule</mat-icon> Pendiente
                }
              </span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Fecha de envío</span>
              <span class="val">{{ oferta()!.Fecha_Envio ? (oferta()!.Fecha_Envio | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Fecha de respuesta</span>
              <span class="val">{{ oferta()!.Fecha_Respuesta ? (oferta()!.Fecha_Respuesta | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
            </div>
            @if (oferta()!.IP_Aceptacion) {
              <div class="resumen-item">
                <span class="lbl">IP de aceptación</span>
                <span class="val">{{ oferta()!.IP_Aceptacion }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Aviso + acción: oferta aceptada → iniciar contratación -->
        @if (oferta()!.Estado_Oferta === 'Aceptada') {
          <div class="card aceptada-card">
            <div class="aceptada-info">
              <mat-icon>check_circle</mat-icon>
              <div>
                <p><strong>Oferta aceptada por el candidato</strong></p>
                <p class="hint">Ya puedes iniciar el proceso de contratación y firma de documentos.</p>
              </div>
            </div>
            <button mat-flat-button color="primary" (click)="irAContratacion()">
              <mat-icon>arrow_forward</mat-icon> Iniciar contratación
            </button>
          </div>
        }

        <!-- KPIs -->
        @if (oferta()!.AplicaKPI) {
          <div class="card">
            <p class="section-title">Cumplimiento por KPI</p>
            @if (kpis().length > 0) {
              <table class="kpi-table">
                <thead>
                  <tr><th>Período</th><th>Unidad</th><th>% Garantizado</th><th>Valor KPI</th></tr>
                </thead>
                <tbody>
                  @for (k of kpis(); track k.Id) {
                    <tr>
                      <td>{{ k.Periodo }}</td>
                      <td>{{ k.UnidadPeriodo }}</td>
                      <td>{{ k.PorcentajeGarantizado }}%</td>
                      <td>$ {{ k.ValorKPI | number }} COP</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="sin-datos">No hay períodos de KPI registrados.</p>
            }
          </div>
        } @else {
          <div class="card aplica-kpi-no">
            <mat-icon>info_outline</mat-icon>
            <p>Esta oferta no incluye cumplimiento por KPI.</p>
          </div>
        }

        <!-- Documentos -->
        <div class="card">
          <p class="section-title">Documentos</p>
          <button mat-stroked-button color="primary" (click)="verDocumentos()">
            <mat-icon>folder_open</mat-icon> Ver carta oferta y adjuntos
          </button>
        </div>

      }
    </div>
  `,
    styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .resumen-card { background: #F4F6F9; }
    .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 13px; font-weight: 500; color: #1E3A5F; display: flex; align-items: center; gap: 4px; }
    .sub { font-size: 11px; color: #9BA8B5; }
    .icon-ok      { color: #1D9E75; font-size: 16px; width: 16px; height: 16px; }
    .icon-pending { color: #BA7517; font-size: 16px; width: 16px; height: 16px; }

    .aceptada-card {
      display: flex; align-items: center; justify-content: space-between;
      background: #EAF3DE; border-color: #97C459; flex-wrap: wrap; gap: 12px;
    }
    .aceptada-info { display: flex; align-items: flex-start; gap: 10px; }
    .aceptada-info mat-icon { color: #3B6D11; flex-shrink: 0; margin-top: 2px; }
    .aceptada-info p { margin: 0 0 4px; font-size: 13px; color: #1E3A5F; }
    .aceptada-info .hint { font-size: 12px; color: #5F6B7A; margin: 0; }

    .kpi-table {
      width: 100%; border-collapse: collapse;
      border: 0.5px solid #D0D8E4; border-radius: 8px; overflow: hidden;
    }
    .kpi-table th {
      background: #F4F6F9; font-size: 11px; font-weight: 500;
      color: #9BA8B5; text-transform: uppercase; padding: 10px 12px; text-align: left;
      border-bottom: 0.5px solid #D0D8E4;
    }
    .kpi-table td {
      font-size: 13px; color: #1E3A5F;
      padding: 8px 12px; border-bottom: 0.5px solid #F4F6F9;
    }
    .sin-datos { font-size: 13px; color: #9BA8B5; margin: 0; }

    .aplica-kpi-no {
      display: flex; align-items: center; gap: 10px;
      background: #F4F6F9;
    }
    .aplica-kpi-no mat-icon { color: #9BA8B5; }
    .aplica-kpi-no p { margin: 0; font-size: 13px; color: #5F6B7A; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class OfertaDetalleComponent implements OnInit {
    private ofertasSvc = inject(OfertasService);
    private participacionSvc = inject(ParticipacionesService);
    private solicitudesSvc = inject(SolicitudesService);
    private candidatosSvc = inject(CandidatosService);
    private kpiSvc = inject(KpiOfertasService);
    private notif = inject(NotificacionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private viewer = inject(DocumentViewerService);

    cargando = signal(true);
    oferta = signal<OfertaItem | null>(null);
    participacion = signal<ParticipacionItem | null>(null);
    solicitud = signal<SolicitudItem | null>(null);
    candidato = signal<CandidatoItem | null>(null);
    kpis = signal<KpiOfertaItem[]>([]);

    ngOnInit() {
        const ofertaId = +this.route.snapshot.paramMap.get('id')!;

        this.ofertasSvc.getById(ofertaId).subscribe({
            next: oferta => {
                this.oferta.set(oferta);
                const participacionId = oferta.ID_Participacion?.Id ?? oferta.ID_ParticipacionId;

                if (!participacionId) {
                    this.cargando.set(false);
                    return;
                }

                this.participacionSvc.getById(participacionId).subscribe({
                    next: participacion => {
                        this.participacion.set(participacion);

                        forkJoin({
                            solicitud: this.solicitudesSvc.getById(
                                participacion.SolicitudId ?? participacion.Solicitud?.Id!
                            ),
                            candidato: this.candidatosSvc.getById(
                                participacion.CandidatoId ?? participacion.Candidato?.Id!
                            ),
                            kpis: oferta.AplicaKPI
                                ? this.kpiSvc.getByOferta(oferta.Id)
                                : of([]),
                        }).subscribe({
                            next: ({ solicitud, candidato, kpis }) => {
                                this.solicitud.set(solicitud);
                                this.candidato.set(candidato);
                                this.kpis.set(kpis ?? []);
                                this.cargando.set(false);
                            },
                            error: () => {
                                this.notif.error('Error al cargar datos relacionados');
                                this.cargando.set(false);
                            },
                        });
                    },
                    error: () => {
                        this.notif.error('Error al cargar la participación');
                        this.cargando.set(false);
                    },
                });
            },
            error: () => {
                this.notif.error('Error al cargar la oferta');
                this.cargando.set(false);
            },
        });
    }

    verDocumentos() {
        if (!this.oferta()) return;
        this.viewer.abrir(`Oferta OF-${this.oferta()!.Id}`, SP_LISTS.OFERTAS, this.oferta()!.Id);
    }

    irAContratacion() {
        if (!this.oferta()) return;
        this.router.navigate(['/analista/ofertas', this.oferta()!.Id, 'contratacion']);
    }

    badgeEstado(e: string): string {
        return {
            Enviada: 'warning',
            Aceptada: 'success',
            Rechazada: 'danger',
            Vencida: 'neutral',
        }[e] ?? 'neutral';
    }

    volver() {
        const candidatoId = this.candidato()?.Id;
        if (candidatoId) this.router.navigate(['/analista/candidatos', candidatoId, 'procesos']);
        else this.router.navigate(['/analista/solicitudes']);
    }
}