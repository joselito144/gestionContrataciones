import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import {
  ParticipacionesService,
  SolicitudesService,
  CandidatosService,
  OfertasService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  ParticipacionItem,
  SolicitudItem,
  CandidatoItem,
} from '../../../shared/models';

@Component({
  selector: 'app-carta-oferta-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>Nueva carta oferta</h2>
            <p class="subtitle">
              @if (candidato() && solicitud()) {
                {{ candidato()!.Nombre_Completo }} ·
                {{ solicitud()!.Pefil_solicitado?.Cargo }}
              }
            </p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <!-- Resumen del proceso -->
        <div class="card resumen-card">
          <p class="section-title">Resumen del proceso</p>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="lbl">Candidato</span>
              <span class="val">{{ candidato()?.Nombre_Completo }}</span>
              <span class="sub">
                {{ candidato()?.TipoIdentificacion }} {{ candidato()?.NumeroIdentificacion }}
              </span>
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
              <span class="lbl">Fecha requerida inicio</span>
              <span class="val">
                {{ solicitud()?.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
              </span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Tipo de contrato</span>
              <span class="val">{{ solicitud()?.TipoContrato }}</span>
            </div>
            <div class="resumen-item">
              <span class="lbl">Rango salarial referencia</span>
              <span class="val">$ {{ solicitud()?.RangoSalario }} COP</span>
            </div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- Condiciones de la oferta -->
          <div class="card">
            <p class="section-title">Condiciones ofertadas</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Cargo ofertado *</mat-label>
                <input matInput formControlName="cargo" />
                <mat-hint>Precargado desde la solicitud — editable si aplica</mat-hint>
                @if (form.get('cargo')?.hasError('required') && form.get('cargo')?.touched) {
                  <mat-error>El cargo es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Salario mensual (COP) *</mat-label>
                <input matInput type="number" formControlName="salario" min="1" />
                <span matPrefix>$&nbsp;</span>
                @if (form.get('salario')?.hasError('required') && form.get('salario')?.touched) {
                  <mat-error>El salario es requerido</mat-error>
                }
                @if (form.get('salario')?.hasError('min')) {
                  <mat-error>El salario debe ser mayor a cero</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio *</mat-label>
                <input matInput [matDatepicker]="picker"
                  formControlName="fechaInicio" />
                <mat-datepicker-toggle matIconSuffix [for]="picker" />
                <mat-datepicker #picker />
                <mat-hint>
                  Sugerida: {{ solicitud()?.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
                </mat-hint>
                @if (form.get('fechaInicio')?.hasError('required') && form.get('fechaInicio')?.touched) {
                  <mat-error>La fecha de inicio es requerida</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de contrato *</mat-label>
                <mat-select formControlName="tipoContrato">
                  <mat-option value="Término Indefinido">Término Indefinido</mat-option>
                  <mat-option value="Término Fijo">Término Fijo</mat-option>
                  <mat-option value="Obra o Labor">Obra o Labor</mat-option>
                  <mat-option value="Prestación Servicios">Prestación Servicios</mat-option>
                  <mat-option value="Aprendizaje">Aprendizaje</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Observaciones / condiciones adicionales</mat-label>
                <textarea matInput formControlName="observaciones" rows="3"
                  placeholder="Beneficios adicionales, modalidad de trabajo, etc.">
                </textarea>
              </mat-form-field>

            </div>
          </div>

          <!-- Flujo de aprobación -->
          <div class="card info-card">
            <mat-icon>info_outline</mat-icon>
            <div>
              <p><strong>Al guardar esta carta oferta:</strong></p>
              <ul>
                <li>Se crea el registro en la lista Ofertas de SharePoint</li>
                <li>Power Automate genera el PDF desde la plantilla Word</li>
                <li>La oferta pasa a aprobación del Director Administrativo</li>
                <li>Una vez aprobada, se envía automáticamente al aspirante</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || guardando()">
              @if (guardando()) { <mat-spinner diameter="18" /> }
              @else {
                <mat-icon>description</mat-icon> Generar carta oferta
              }
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .resumen-card { background: #F4F6F9; }
    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .sub { font-size: 11px; color: #9BA8B5; }
    .info-card {
      display: flex; gap: 12px;
      background: #E6F1FB; border-color: #B5D4F4;
    }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p  { margin: 0 0 8px; font-size: 13px; color: #1E3A5F; }
    .info-card ul { margin: 0; padding-left: 20px; font-size: 12px; color: #5F6B7A; }
    .info-card li { margin-bottom: 4px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
  `],
})
export class CartaOfertaFormComponent implements OnInit {
  private participacionSvc = inject(ParticipacionesService);
  private solicitudesSvc   = inject(SolicitudesService);
  private candidatosSvc    = inject(CandidatosService);
  private ofertasSvc       = inject(OfertasService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private route            = inject(ActivatedRoute);
  private fb               = inject(FormBuilder);

  cargando      = signal(true);
  guardando     = signal(false);
  participacion = signal<ParticipacionItem | null>(null);
  solicitud     = signal<SolicitudItem | null>(null);
  candidato     = signal<CandidatoItem | null>(null);

  form = this.fb.group({
    cargo:         ['', Validators.required],
    salario:       [null as number | null, [Validators.required, Validators.min(1)]],
    fechaInicio:   [null as Date | null, Validators.required],
    tipoContrato:  ['', Validators.required],
    observaciones: [''],
  });

  ngOnInit() {
    const participacionId = +this.route.snapshot.paramMap.get('id')!;

    this.participacionSvc.getById(participacionId).subscribe({
      next: participacion => {
        this.participacion.set(participacion);

        // Carga candidato y solicitud en paralelo usando los IDs del lookup
        forkJoin({
          solicitud: this.solicitudesSvc.getById(participacion.SolicitudId),
          candidato: this.candidatosSvc.getById(participacion.CandidatoId),
        }).subscribe({
          next: ({ solicitud, candidato }) => {
            this.solicitud.set(solicitud);
            this.candidato.set(candidato);

            // Precarga cargo y tipo de contrato desde la solicitud
            this.form.patchValue({
              cargo:        solicitud.Pefil_solicitado?.Cargo ?? '',
              tipoContrato: solicitud.TipoContrato ?? '',
            });

            this.cargando.set(false);
          },
          error: () => {
            this.notif.error('Error al cargar datos del proceso');
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

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);

    const v     = this.form.value;
    const fecha = v.fechaInicio as Date;

    this.ofertasSvc.create({
      ID_ParticipacionId: this.participacion()!.Id,
      Salario_Ofertado:   v.salario!,
      Cargo:              v.cargo!,
      Estado_Oferta:      'Enviada',
      Aprobada_DirAdm:    false,
    }).subscribe({
      next: () => {
        this.notif.exito(
          'Carta oferta creada. Power Automate iniciará el proceso de aprobación.'
        );
        this.guardando.set(false);
        this.router.navigate(['/analista/candidatos',
          this.participacion()!.CandidatoId, 'procesos']);
      },
      error: () => {
        this.notif.error('Error al crear la carta oferta');
        this.guardando.set(false);
      },
    });
  }

  volver() {
    this.router.navigate(['/analista/candidatos',
      this.participacion()?.CandidatoId, 'procesos']);
  }
}