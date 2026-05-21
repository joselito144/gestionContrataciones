import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { CandidatosService, ParticipacionesService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import { CandidatoItem, ParticipacionItem, EstadoParticipacion } from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

@Component({
  selector: 'app-candidato-procesos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>{{ candidato()?.Nombre_Completo }}</h2>
            <p class="subtitle">
              {{ candidato()?.TipoIdentificacion }} {{ candidato()?.NumeroIdentificacion }} ·
              Historial de participaciones en procesos de selección
            </p>
          </div>
        </div>
        <button mat-stroked-button color="primary"
          (click)="verDocumentos()"
          matTooltip="CV y otros documentos del candidato">
          <mat-icon>folder_open</mat-icon> Documentos
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <!-- Datos del candidato -->
        <div class="card candidato-resumen">
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="lbl">Correo</span>
              <span class="val">{{ candidato()?.Correo }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Teléfono</span>
              <span class="val">{{ candidato()?.Telefono }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Dirección</span>
              <span class="val">{{ candidato()?.Direccion || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Participaciones -->
        <div class="section-header">
          <h3>Procesos ({{ participaciones().length }})</h3>
          <button mat-flat-button color="primary" (click)="vincularNuevo()">
            <mat-icon>add</mat-icon> Vincular a solicitud
          </button>
        </div>

        @for (p of participaciones(); track p.Id) {
          <div class="participacion-card card">
            <div class="part-header">
              <div>
                <div class="part-solicitud">{{ p.Solicitud?.Title }}</div>
                <div class="part-fecha">Ingresó: {{ p.Fecha_Ingreso | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="part-right">
                <span [class]="'badge badge--' + badgeEstado(p.Estado)">
                  {{ p.Estado }}
                </span>
                <div class="part-examenes">
                  @if (p.Examenes_OK) {
                    <span class="badge badge--success">
                      <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">check</mat-icon>
                      Exámenes OK
                    </span>
                  } @else {
                    <span class="badge badge--warning">Exámenes pendientes</span>
                  }
                </div>
              </div>
            </div>

            @if (p.Notas_Proceso) {
              <p class="part-notas">{{ p.Notas_Proceso }}</p>
            }

            <div class="part-footer">
              <!-- Cambio de estado -->
              <div class="estado-actions">
                @if (p.Estado !== 'Seleccionado') {
                  <button mat-stroked-button color="primary" (click)="cambiarEstado(p, 'Seleccionado')">
                    <mat-icon>star</mat-icon> Seleccionar
                  </button>
                }
                @if (p.Estado !== 'Descartado') {
                  <button mat-stroked-button color="warn" (click)="cambiarEstado(p, 'Descartado')">
                    <mat-icon>block</mat-icon> Descartar
                  </button>
                }
                @if (p.Estado !== 'En proceso') {
                  <button mat-stroked-button (click)="cambiarEstado(p, 'En proceso')">
                    <mat-icon>refresh</mat-icon> Reactivar
                  </button>
                }
              </div>
              <!-- Documentos del proceso -->
              <button mat-icon-button color="primary"
                matTooltip="Ver documentos de esta participación"
                (click)="verDocumentosParticipacion(p)">
                <mat-icon>attach_file</mat-icon>
              </button>
            </div>
          </div>
        }

        @if (participaciones().length === 0) {
          <div class="empty-state">
            <mat-icon>work_outline</mat-icon>
            <p>Este candidato no ha participado en ningún proceso aún</p>
            <button mat-flat-button color="primary" (click)="vincularNuevo()">
              Vincular a una solicitud
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .candidato-resumen { background: #F4F6F9; }
    .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 13px; font-weight: 500; color: #1E3A5F; }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 8px; }
    .section-header h3 { margin: 0; font-size: 14px; font-weight: 500; color: #1E3A5F; }

    .participacion-card { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
    .part-header  { display: flex; align-items: flex-start; justify-content: space-between; }
    .part-solicitud { font-size: 14px; font-weight: 500; color: #1E3A5F; }
    .part-fecha   { font-size: 12px; color: #9BA8B5; margin-top: 2px; }
    .part-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .part-examenes { }
    .part-notas   { font-size: 12px; color: #5F6B7A; margin: 0; padding: 8px; background: #F4F6F9; border-radius: 6px; }
    .part-footer  { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 0.5px solid #EEF1F5; }
    .estado-actions { display: flex; gap: 6px; flex-wrap: wrap; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class CandidatoProcesosComponent implements OnInit {
  private candidatosSvc    = inject(CandidatosService);
  private participacionSvc = inject(ParticipacionesService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private route            = inject(ActivatedRoute);
  private viewer           = inject(DocumentViewerService);

  candidato      = signal<CandidatoItem | null>(null);
  participaciones = signal<ParticipacionItem[]>([]);
  cargando       = signal(true);
  candidatoId    = 0;

  ngOnInit() {
    this.candidatoId = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      candidato:      this.candidatosSvc.getById(this.candidatoId),
      participaciones: this.participacionSvc.getByCandidato(this.candidatoId),
    }).subscribe({
      next: ({ candidato, participaciones }) => {
        this.candidato.set(candidato);
        this.participaciones.set(participaciones);
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar datos'); this.cargando.set(false); },
    });
  }

  vincularNuevo() {
    this.router.navigate(['/analista/participaciones/nueva'], {
      queryParams: { candidatoId: this.candidatoId },
    });
  }

  cambiarEstado(p: ParticipacionItem, estado: EstadoParticipacion) {
    this.participacionSvc.cambiarEstado(p.Id, estado).subscribe({
      next: () => {
        this.notif.exito(`Candidato marcado como ${estado}`);
        this.participaciones.update(lista =>
          lista.map(item => item.Id === p.Id ? { ...item, Estado: estado } : item)
        );
      },
      error: () => this.notif.error('Error al cambiar estado'),
    });
  }

  verDocumentos() {
    const c = this.candidato();
    if (!c) return;
    this.viewer.abrir(c.Nombre_Completo, SP_LISTS.CANDIDATOS, c.Id);
  }

  verDocumentosParticipacion(p: ParticipacionItem) {
    this.viewer.abrir(
      `Proceso: ${p.Solicitud?.Title} — ${this.candidato()?.Nombre_Completo}`,
      SP_LISTS.PARTICIPACIONES,
      p.Id
    );
  }

  volver() { this.router.navigate(['/analista/candidatos']); }

  badgeEstado(e: EstadoParticipacion): string {
    return { 'En proceso': 'primary', 'Seleccionado': 'success', 'Descartado': 'neutral' }[e] ?? 'neutral';
  }
}