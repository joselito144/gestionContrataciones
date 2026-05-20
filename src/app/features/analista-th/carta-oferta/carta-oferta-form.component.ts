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
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import {
  SolicitudesService,
  CandidatosService,
  OfertasService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { CandidatoItem, SolicitudItem } from '../../../shared/models';

@Component({
  selector: 'app-analista-carta-oferta-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule,
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
            @if (solicitud()) {
              <p class="subtitle">
                {{ solicitud()?.Perfil_Solicitado?.Cargo }} ·
                {{ solicitud()?.AreaSolicitante?.Title }}
              </p>
            }
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {

        <!-- Resumen de la solicitud -->
        <div class="card resumen-card">
          <p class="section-title">Resumen de la solicitud</p>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="resumen-lbl">Perfil solicitado</span>
              <span class="resumen-val">{{ solicitud()?.Perfil_Solicitado?.Cargo }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-lbl">Área</span>
              <span class="resumen-val">{{ solicitud()?.AreaSolicitante?.Title }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-lbl">Motivo vacante</span>
              <span class="resumen-val">{{ solicitud()?.MotivoVacante }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-lbl">Fecha requerida inicio</span>
              <span class="resumen-val">
                {{ solicitud()?.FechaRequeridaInicio | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
        </div>

        @if (candidatos().length === 0) {
          <div class="empty-state">
            <mat-icon>person_search</mat-icon>
            <p>No hay candidatos con estado "Seleccionado" para esta solicitud.</p>
            <p class="hint">El Analista TH debe marcar al menos un candidato como seleccionado antes de generar la carta oferta.</p>
            <button mat-stroked-button (click)="volver()">Volver</button>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="guardar()">

            <!-- Candidato -->
            <div class="card">
              <p class="section-title">Candidato seleccionado</p>
              <mat-form-field appearance="outline">
                <mat-label>Candidato *</mat-label>
                <mat-select formControlName="candidatoId">
                  @for (c of candidatos(); track c.Id) {
                    <mat-option [value]="c.Id">
                      {{ c.Nombre_Completo }} · {{ c.Correo }}
                    </mat-option>
                  }
                </mat-select>
                @if (candidatos().length === 1) {
                  <mat-hint>Un candidato seleccionado para esta solicitud</mat-hint>
                } @else {
                  <mat-hint>{{ candidatos().length }} candidatos seleccionados</mat-hint>
                }
              </mat-form-field>
            </div>

            <!-- Condiciones -->
            <div class="card">
              <p class="section-title">Condiciones de la oferta</p>
              <div class="field-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Cargo ofertado *</mat-label>
                  <input matInput formControlName="cargo" />
                  <mat-hint>Precargado desde el perfil solicitado — editable si aplica</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Salario mensual (COP) *</mat-label>
                  <input matInput type="number" formControlName="salario" min="0" />
                  <span matPrefix>$&nbsp;</span>
                  @if (form.get('salario')?.hasError('min')) {
                    <mat-error>El salario debe ser mayor a cero</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha de inicio *</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="fechaInicio" />
                  <mat-datepicker-toggle matIconSuffix [for]="picker" />
                  <mat-datepicker #picker />
                  <mat-hint>Sugerida: {{ solicitud()?.FechaRequeridaInicio | date:'dd/MM/yyyy' }}</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Tipo de contrato *</mat-label>
                  <mat-select formControlName="tipoContrato">
                    <mat-option value="Término indefinido">Término indefinido</mat-option>
                    <mat-option value="Término fijo">Término fijo</mat-option>
                    <mat-option value="Por obra o labor">Por obra o labor</mat-option>
                    <mat-option value="Prestación de servicios">Prestación de servicios</mat-option>
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

            <!-- Nota del flujo -->
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
              <button
                mat-flat-button color="primary"
                type="submit"
                [disabled]="form.invalid || guardando()">
                @if (guardando()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>description</mat-icon> Generar carta oferta
                }
              </button>
            </div>

          </form>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .resumen-card { background: #F4F6F9; }
    .resumen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .resumen-lbl  { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .resumen-val  { font-size: 13px; font-weight: 500; color: #1E3A5F; }

    .info-card {
      display: flex; gap: 12px;
      background: #E6F1FB; border-color: #B5D4F4;
    }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p  { margin: 0 0 8px; font-size: 13px; color: #1E3A5F; }
    .info-card ul { margin: 0; padding-left: 20px; font-size: 12px; color: #5F6B7A; }
    .info-card li { margin-bottom: 4px; }

    .empty-state {
      text-align: center; padding: 48px;
      color: #9BA8B5; display: flex;
      flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p    { margin: 0; font-size: 13px; }
    .empty-state .hint { font-size: 12px; max-width: 400px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
  `],
})
export class CartaOfertaFormComponent implements OnInit {
  private solicitudesSvc = inject(SolicitudesService);
  private candidatosSvc  = inject(CandidatosService);
  private ofertasSvc     = inject(OfertasService);
  private notif          = inject(NotificacionService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private fb             = inject(FormBuilder);

  cargando   = signal(true);
  guardando  = signal(false);
  solicitud  = signal<SolicitudItem | null>(null);
  candidatos = signal<CandidatoItem[]>([]);

  form = this.fb.group({
    candidatoId:    [null as number | null, Validators.required],
    cargo:          ['', Validators.required],
    salario:        [null as number | null, [Validators.required, Validators.min(1)]],
    fechaInicio:    [null as Date | null, Validators.required],
    tipoContrato:   ['Término indefinido', Validators.required],
    observaciones:  [''],
  });

  ngOnInit() {
    const solicitudId = +this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      solicitud:   this.solicitudesSvc.getById(solicitudId),
      candidatos:  this.candidatosSvc.getSeleccionados(solicitudId),
    }).subscribe({
      next: ({ solicitud, candidatos }) => {
        this.solicitud.set(solicitud);
        this.candidatos.set(candidatos);

        // Precarga el cargo desde el perfil del lookup
        this.form.patchValue({
          cargo: solicitud.Perfil_Solicitado?.Cargo ?? '',
          // Si hay un solo candidato, lo preselecciona automáticamente
          candidatoId: candidatos.length === 1 ? candidatos[0].Id : null,
        });

        this.cargando.set(false);
      },
      error: () => {
        this.notif.error('Error al cargar datos de la solicitud');
        this.cargando.set(false);
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;

    this.ofertasSvc.create({
      ID_CandidatoId:  v.candidatoId!,
      Salario_Ofertado: v.salario!,
      Cargo:           v.cargo!,
      Estado_Oferta:   'Enviada',
      Aprobada_DirAdm: false,
    }).subscribe({
      next: () => {
        this.notif.exito('Carta oferta creada. Power Automate iniciará el proceso.');
        this.guardando.set(false);
        this.router.navigate(['/lider/solicitudes']);
      },
      error: () => {
        this.notif.error('Error al crear la carta oferta');
        this.guardando.set(false);
      },
    });
  }

  volver() { this.router.navigate(['/lider/solicitudes']); }
}