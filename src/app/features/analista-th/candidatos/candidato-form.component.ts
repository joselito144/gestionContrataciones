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
import { MatDividerModule } from '@angular/material/divider';
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { TipoIdentificacion } from '../../../shared/models';

@Component({
  selector: 'app-candidato-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>{{ esNuevo ? 'Nuevo candidato' : 'Editar candidato' }}</h2>
            <p class="subtitle">
              Datos maestros del candidato ·
              El CV y documentos se adjuntan directamente al registro en SharePoint
            </p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- Identificación -->
          <div class="card">
            <p class="section-title">1. Identificación</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Tipo de identificación *</mat-label>
                <mat-select formControlName="tipoIdentificacion">
                  @for (t of tiposId; track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-select>
                @if (form.get('tipoIdentificacion')?.hasError('required') && form.get('tipoIdentificacion')?.touched) {
                  <mat-error>Campo requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Número de identificación *</mat-label>
                <input matInput formControlName="numeroIdentificacion" />
                @if (form.get('numeroIdentificacion')?.hasError('required') && form.get('numeroIdentificacion')?.touched) {
                  <mat-error>Campo requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Nombre completo *</mat-label>
                <input matInput formControlName="nombre"
                  placeholder="Nombres y apellidos completos" />
                @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                  <mat-error>El nombre es requerido</mat-error>
                }
              </mat-form-field>

            </div>
          </div>

          <!-- Datos de contacto -->
          <div class="card">
            <p class="section-title">2. Datos de contacto</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Correo electrónico *</mat-label>
                <input matInput formControlName="correo"
                  type="email" placeholder="correo@dominio.com" />
                @if (form.get('correo')?.hasError('email') && form.get('correo')?.touched) {
                  <mat-error>Formato de correo inválido</mat-error>
                }
                @if (form.get('correo')?.hasError('required') && form.get('correo')?.touched) {
                  <mat-error>El correo es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Teléfono *</mat-label>
                <input matInput formControlName="telefono"
                  placeholder="300 000 0000" />
                @if (form.get('telefono')?.hasError('required') && form.get('telefono')?.touched) {
                  <mat-error>El teléfono es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="direccion"
                  placeholder="Calle, barrio, ciudad" />
              </mat-form-field>

            </div>
          </div>

          <!-- Notas -->
          <div class="card">
            <p class="section-title">3. Observaciones del analista</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notas generales</mat-label>
              <textarea matInput formControlName="notas" rows="3"
                placeholder="Observaciones generales sobre el candidato (no específicas de un proceso)...">
              </textarea>
            </mat-form-field>
          </div>

          <!-- Documentos -->
          @if (!esNuevo) {
            <div class="card info-card">
              <mat-icon>info_outline</mat-icon>
              <div>
                <p><strong>Documentos del candidato (CV, certificados, etc.)</strong></p>
                <p class="hint">
                  Para adjuntar o ver documentos, dirígete al ítem del candidato en SharePoint
                  o usa el visor de documentos desde la lista de candidatos.
                </p>
              </div>
            </div>
          }

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || guardando()">
              @if (guardando()) { <mat-spinner diameter="18" /> }
              @else { Guardar candidato }
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .info-card {
      display: flex; gap: 12px;
      background: #E6F1FB; border-color: #B5D4F4;
    }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p    { margin: 0 0 4px; font-size: 13px; color: #1E3A5F; }
    .info-card .hint { font-size: 12px; color: #5F6B7A; margin: 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class CandidatoFormComponent implements OnInit {
  private svc    = inject(CandidatosService);
  private notif  = inject(NotificacionService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private fb     = inject(FormBuilder);

  cargando  = signal(true);
  guardando = signal(false);
  esNuevo   = true;
  candidatoId: number | null = null;

  tiposId: TipoIdentificacion[] = ['CC','CE','PA','NIT','Otro'];

  form = this.fb.group({
    tipoIdentificacion:   ['' as TipoIdentificacion, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nombre:               ['', Validators.required],
    correo:               ['', [Validators.required, Validators.email]],
    telefono:             ['', Validators.required],
    direccion:            [''],
    notas:                [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.esNuevo    = !id;
    this.candidatoId = id ? +id : null;

    if (!this.esNuevo && this.candidatoId) {
      this.svc.getById(this.candidatoId).subscribe({
        next: c => {
          this.form.patchValue({
            tipoIdentificacion:   c.TipoIdentificacion,
            numeroIdentificacion: c.NumeroIdentificacion,
            nombre:               c.Nombre_Completo,
            correo:               c.Correo,
            telefono:             c.Telefono,
            direccion:            c.Direccion,
            notas:                c.Notas_Analista,
          });
          this.cargando.set(false);
        },
        error: () => { this.notif.error('Error al cargar el candidato'); this.cargando.set(false); },
      });
    } else {
      this.cargando.set(false);
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;

    const data = {
      Nombre_Completo:      v.nombre!,
      TipoIdentificacion:   v.tipoIdentificacion!,
      NumeroIdentificacion: v.numeroIdentificacion!,
      Correo:               v.correo!,
      Telefono:             v.telefono!,
      Direccion:            v.direccion ?? '',
      Notas_Analista:       v.notas ?? '',
    };

    const obs = this.esNuevo
      ? this.svc.create(data)
      : this.svc.update(this.candidatoId!, data);

    obs.subscribe({
      next: () => {
        this.notif.exito(this.esNuevo ? 'Candidato registrado' : 'Candidato actualizado');
        this.guardando.set(false);
        this.volver();
      },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  volver() { this.router.navigate(['/analista/candidatos']); }
}