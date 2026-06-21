import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  OfertasService,
  ParticipacionesService,
  CandidatosService,
  SolicitudesService,
  PlantillasDocumentoService,
  ContratacionesService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  OfertaItem, ParticipacionItem, CandidatoItem, SolicitudItem,
  PlantillaDocumentoItem, ContratacionItem,
} from '../../../shared/models';

// ── Validación de campos requeridos del candidato ─────────────────────────────
const CAMPOS_REQUERIDOS: { campo: keyof CandidatoItem; etiqueta: string }[] = [
  { campo: 'FechaExpedicionDoc',  etiqueta: 'Fecha de expedición del documento' },
  { campo: 'CiudadExpedicionDoc', etiqueta: 'Ciudad de expedición del documento' },
  { campo: 'FechaNacimiento',     etiqueta: 'Fecha de nacimiento' },
  { campo: 'CiudadNacimiento',    etiqueta: 'Ciudad de nacimiento' },
  { campo: 'EstadoCivil',         etiqueta: 'Estado civil' },
  { campo: 'Escolaridad',         etiqueta: 'Escolaridad' },
  { campo: 'GrupoSanguineo',      etiqueta: 'Grupo sanguíneo' },
  { campo: 'TipoVivienda',        etiqueta: 'Tipo de vivienda' },
  { campo: 'Estrato',             etiqueta: 'Estrato' },
  { campo: 'Barrio',              etiqueta: 'Barrio' },
  { campo: 'EPS',                 etiqueta: 'EPS' },
  { campo: 'Pension',             etiqueta: 'Fondo de pensiones' },
  { campo: 'NumeroCuenta',        etiqueta: 'Número de cuenta' },
  { campo: 'Banco',               etiqueta: 'Banco' },
];

interface CampoFaltante { etiqueta: string; }

@Component({
  selector: 'app-iniciar-contratacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatCheckboxModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>Iniciar proceso de contratación</h2>
            @if (candidato()) {
              <p class="subtitle">{{ candidato()!.Nombre_Completo }} · OF-{{ oferta()?.Id }}</p>
            }
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (!oferta()) {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se encontró la oferta solicitada</p>
        </div>
      } @else if (oferta()!.Estado_Oferta !== 'Aceptada') {
        <div class="card aviso-card aviso-warning">
          <mat-icon>warning</mat-icon>
          <div>
            <p><strong>Esta oferta aún no ha sido aceptada</strong></p>
            <p class="hint">
              El proceso de contratación solo puede iniciarse cuando el candidato
              ha aceptado la carta oferta. Estado actual: <strong>{{ oferta()!.Estado_Oferta }}</strong>
            </p>
          </div>
        </div>
      } @else if (contratacionExistente()) {
        <!-- Ya existe un proceso de contratación para esta oferta -->
        <div class="card aviso-card aviso-info">
          <mat-icon>info</mat-icon>
          <div>
            <p><strong>El proceso de contratación ya fue iniciado</strong></p>
            <p class="hint">
              Estado actual: <strong>{{ etiquetaEstado(contratacionExistente()!.Estado_Contratacion) }}</strong>.
              No es posible iniciar el proceso nuevamente para esta oferta.
            </p>
          </div>
        </div>
        <div class="form-actions">
          <button mat-flat-button color="primary" (click)="volver()">
            <mat-icon>arrow_back</mat-icon> Volver al detalle de la oferta
          </button>
        </div>
      } @else {

        <!-- Resumen -->
        <div class="card resumen-card">
          <p class="section-title">Resumen del proceso</p>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="lbl">Candidato</span>
              <span class="val">{{ candidato()?.Nombre_Completo }}</span>
              <span class="sub">{{ candidato()?.TipoIdentificacion }} {{ candidato()?.NumeroIdentificacion }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Cargo</span>
              <span class="val">{{ oferta()?.Cargo }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Estado de la oferta</span>
              <span class="val"><mat-icon class="icon-ok">check_circle</mat-icon> Aceptada</span>
            </div>
          </div>
        </div>

        <!-- Validación de información del candidato -->
        <div class="card">
          <p class="section-title">1. Información del candidato</p>

          @if (camposFaltantes().length === 0) {
            <div class="validacion-ok">
              <mat-icon>check_circle</mat-icon>
              <p>La información del candidato está completa. Puedes continuar con el proceso.</p>
            </div>
          } @else {
            <div class="validacion-error">
              <div class="validacion-error-header">
                <mat-icon>error_outline</mat-icon>
                <p>Faltan {{ camposFaltantes().length }} campo(s) por diligenciar antes de continuar.</p>
              </div>
              <ul class="campos-faltantes-list">
                @for (c of camposFaltantes(); track c.etiqueta) { <li>{{ c.etiqueta }}</li> }
              </ul>
              <button mat-flat-button color="primary" (click)="irACompletarCandidato()">
                <mat-icon>edit</mat-icon> Completar información del candidato
              </button>
            </div>
          }
        </div>

        <!-- Selección de documentos adicionales -->
        <div class="card" [class.card-disabled]="camposFaltantes().length > 0">
          <p class="section-title">2. Documentos para el proceso de firma</p>
          <p class="hint-text">
            Selecciona los documentos adicionales que se generarán y enviarán a firma
            junto con el contrato.
          </p>

          @if (cargandoPlantillas()) {
            <div class="loading-center-sm"><mat-spinner diameter="28" /></div>
          } @else if (plantillas().length === 0) {
            <p class="sin-plantillas">
              No hay plantillas de documentos configuradas. Contacta al administrador
              para agregar plantillas en la lista PlantillasDocumento.
            </p>
          } @else {
            <div class="plantillas-lista">
              @for (p of plantillas(); track p.Id) {
                <label class="plantilla-item" [class.disabled]="camposFaltantes().length > 0">
                  <mat-checkbox
                    [checked]="plantillasSeleccionadas().has(p.Id)"
                    [disabled]="camposFaltantes().length > 0"
                    (change)="toggleSeleccion(p.Id)">
                  </mat-checkbox>
                  <div class="plantilla-info">
                    <span class="plantilla-nombre">{{ p.Title }}</span>
                    <span class="plantilla-archivo">{{ p.NombreArchivo }}</span>
                  </div>
                </label>
              }
            </div>
          }
        </div>

        <!-- Notas opcionales -->
        <div class="card" [class.card-disabled]="camposFaltantes().length > 0">
          <p class="section-title">3. Observaciones (opcional)</p>
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Notas para el proceso de contratación</mat-label>
            <textarea matInput rows="3" [(ngModel)]="notas"
              [disabled]="camposFaltantes().length > 0"
              placeholder="Información adicional relevante para esta contratación...">
            </textarea>
          </mat-form-field>
        </div>


        <div class="form-actions">
          <button mat-button type="button" (click)="volver()">Cancelar</button>
          <button mat-flat-button color="primary"
            [disabled]="camposFaltantes().length > 0 || enviando()"
            (click)="iniciarProceso()">
            @if (enviando()) {
              <mat-spinner diameter="18" />
            } @else {
              <mat-icon>send</mat-icon>
              Iniciar proceso de firma ({{ plantillasSeleccionadas().size + 1 }} documento(s))
            }
          </button>
        </div>

      }
    </div>
  `,
  styles: [`
    .loading-center    { display: flex; justify-content: center; padding: 48px; }
    .loading-center-sm { display: flex; justify-content: center; padding: 16px; }

    .resumen-card { background: #F4F6F9; }
    .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 13px; font-weight: 500; color: #1E3A5F; display: flex; align-items: center; gap: 4px; }
    .sub { font-size: 11px; color: #9BA8B5; }
    .icon-ok { color: #1D9E75; font-size: 16px; width: 16px; height: 16px; }

    .hint-text { font-size: 12px; color: #9BA8B5; margin: 0 0 16px; }

    .aviso-card { display: flex; gap: 12px; align-items: flex-start; }
    .aviso-warning { background: #FAEEDA; border-color: #E0B468; }
    .aviso-warning mat-icon { color: #BA7517; flex-shrink: 0; }
    .aviso-info { background: #E6F1FB; border-color: #B5D4F4; }
    .aviso-info mat-icon { color: #185FA5; flex-shrink: 0; }
    .aviso-card p { margin: 0 0 4px; font-size: 13px; color: #1E3A5F; }
    .aviso-card .hint { font-size: 12px; color: #5F6B7A; margin: 0; }

    .validacion-ok {
      display: flex; align-items: center; gap: 10px;
      background: #EAF3DE; border-radius: 8px; padding: 14px 16px;
      border: 0.5px solid #97C459;
    }
    .validacion-ok mat-icon { color: #3B6D11; flex-shrink: 0; }
    .validacion-ok p { margin: 0; font-size: 13px; color: #3B6D11; }

    .validacion-error {
      background: #FBE9E8; border-radius: 8px; padding: 14px 16px;
      border: 0.5px solid #E8918F;
    }
    .validacion-error-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
    .validacion-error-header mat-icon { color: #A32D2D; flex-shrink: 0; }
    .validacion-error-header p { margin: 0; font-size: 13px; color: #A32D2D; }
    .campos-faltantes-list { margin: 0 0 14px; padding-left: 38px; font-size: 12px; color: #5F6B7A; }
    .campos-faltantes-list li { margin-bottom: 3px; }

    .card-disabled { opacity: 0.55; pointer-events: none; }

    .sin-plantillas { font-size: 13px; color: #9BA8B5; margin: 0; }

    .plantillas-lista { display: flex; flex-direction: column; gap: 4px; }
    .plantilla-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 8px; cursor: pointer;
      transition: background .15s;
    }
    .plantilla-item:hover { background: #F4F6F9; }
    .plantilla-item.disabled { cursor: not-allowed; }
    .plantilla-info { display: flex; flex-direction: column; gap: 1px; }
    .plantilla-nombre  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .plantilla-archivo { font-size: 11px; color: #9BA8B5; }

    .info-card { display: flex; gap: 12px; background: #E6F1FB; border-color: #B5D4F4; }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p   { margin: 0 0 6px; font-size: 13px; color: #1E3A5F; }
    .info-card ul  { margin: 0; padding-left: 20px; font-size: 12px; color: #5F6B7A; }
    .info-card li  { margin-bottom: 4px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }

    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class IniciarContratacionComponent implements OnInit {
  private ofertasSvc        = inject(OfertasService);
  private participacionSvc  = inject(ParticipacionesService);
  private candidatosSvc     = inject(CandidatosService);
  private solicitudesSvc    = inject(SolicitudesService);
  private plantillasSvc     = inject(PlantillasDocumentoService);
  private contratacionesSvc = inject(ContratacionesService);
  private notif             = inject(NotificacionService);
  private router            = inject(Router);
  private route             = inject(ActivatedRoute);

  cargando            = signal(true);
  cargandoPlantillas  = signal(true);
  enviando            = signal(false);

  oferta        = signal<OfertaItem | null>(null);
  participacion = signal<ParticipacionItem | null>(null);
  candidato     = signal<CandidatoItem | null>(null);
  solicitud     = signal<SolicitudItem | null>(null);
  plantillas    = signal<PlantillaDocumentoItem[]>([]);

  contratacionExistente = signal<ContratacionItem | null>(null);

  plantillasSeleccionadas = signal<Set<number>>(new Set());
  notas = '';

  camposFaltantes = computed<CampoFaltante[]>(() => {
    const c = this.candidato();
    if (!c) return [];
    return CAMPOS_REQUERIDOS
      .filter(({ campo }) => {
        const valor = c[campo];
        return valor === null || valor === undefined || valor === '';
      })
      .map(({ etiqueta }) => ({ etiqueta }));
  });

  ngOnInit() {
    const ofertaId = +this.route.snapshot.paramMap.get('id')!;

    this.ofertasSvc.getById(ofertaId).subscribe({
      next: oferta => {
        this.oferta.set(oferta);

        if (oferta.Estado_Oferta !== 'Aceptada') {
          this.cargando.set(false);
          return;
        }

        // Verifica primero si ya existe un proceso de contratación —
        // evita iniciar dos veces el mismo proceso
        this.contratacionesSvc.existeContratacion(oferta.Id).subscribe({
          next: existentes => {
            if (existentes.length > 0) {
              // Si ya existe, carga el registro completo para mostrar su estado
              this.contratacionesSvc.getById(existentes[0].Id).subscribe({
                next: c => { this.contratacionExistente.set(c); this.cargando.set(false); },
                error: () => { this.cargando.set(false); },
              });
              return;
            }
            this.cargarDatosCompletos(oferta);
          },
          error: () => this.cargarDatosCompletos(oferta),
        });
      },
      error: () => {
        this.notif.error('Error al cargar la oferta');
        this.cargando.set(false);
      },
    });
  }

  private cargarDatosCompletos(oferta: OfertaItem) {
    const participacionId = oferta.ID_Participacion?.Id ?? oferta.ID_ParticipacionId;
    if (!participacionId) {
      this.cargando.set(false);
      return;
    }

    this.participacionSvc.getById(participacionId).subscribe({
      next: participacion => {
        this.participacion.set(participacion);

        forkJoin({
          candidato: this.candidatosSvc.getById(
            participacion.CandidatoId ?? participacion.Candidato?.Id!
          ),
          solicitud: this.solicitudesSvc.getById(
            participacion.SolicitudId ?? participacion.Solicitud?.Id!
          ),
        }).subscribe({
          next: ({ candidato, solicitud }) => {
            this.candidato.set(candidato);
            this.solicitud.set(solicitud);
            this.cargando.set(false);
            this.cargarPlantillas();
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
  }

  private cargarPlantillas() {
    this.plantillasSvc.getActivas().subscribe({
      next: plantillas => {
        this.plantillas.set(plantillas);
        this.cargandoPlantillas.set(false);
      },
      error: () => {
        this.notif.error('Error al cargar las plantillas de documentos');
        this.cargandoPlantillas.set(false);
      },
    });
  }

  toggleSeleccion(plantillaId: number) {
    this.plantillasSeleccionadas.update(actual => {
      const nuevo = new Set(actual);
      if (nuevo.has(plantillaId)) nuevo.delete(plantillaId);
      else nuevo.add(plantillaId);
      return nuevo;
    });
  }

  irACompletarCandidato() {
    if (!this.candidato()) return;
    this.router.navigate(['/analista/candidatos', this.candidato()!.Id]);
  }

  etiquetaEstado(estado: string): string {
    return {
      Iniciado:               'Iniciado',
      Generando_Documentos:   'Generando documentos',
      Enviado_Firma:          'Enviado a firma',
      Firmado_Aspirante:      'Firmado por el aspirante',
      Completado:             'Completado',
      Error:                  'Error en el proceso',
    }[estado] ?? estado;
  }

  // Crea el registro en Contrataciones. Este es el disparador real hacia
  // Power Automate — el flujo debe configurarse con disparador "se crea
  // un elemento" sobre la lista Contrataciones.
  iniciarProceso() {
    if (this.camposFaltantes().length > 0) return;
    if (!this.oferta()) return;

    this.enviando.set(true);

    const nombresSeleccionados = this.plantillas()
      .filter(p => this.plantillasSeleccionadas().has(p.Id))
      .map(p => p.Title);

    this.contratacionesSvc.create({
      ID_OfertaId:            this.oferta()!.Id,
      DocumentosAdicionales:  nombresSeleccionados,
      Estado_Contratacion:    'Iniciado',
      Fecha_Inicio:           new Date().toISOString(),
      Notas:                  this.notas ?? '',
    }).subscribe({
      next: (res) => {
        this.notif.exito('Proceso de contratación iniciado. Recibirás notificaciones del avance.');
        this.enviando.set(false);

        const ofertaId = this.oferta()!.Id;
        this.router.navigate(['/analista/ofertas', ofertaId]);
      },
      error: (err) => {
        console.error('[IniciarContratacion] Error al crear registro en Contrataciones:', err);
        this.notif.error('Error al iniciar el proceso de contratación. Intenta nuevamente.');
        this.enviando.set(false);
      },
    });
  }

  volver() {
    if (this.oferta()) {
      this.router.navigate(['/analista/ofertas', this.oferta()!.Id]);
    } else {
      this.router.navigate(['/analista/solicitudes']);
    }
  }
}