import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CandidatosService, SolicitudesService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudItem } from '../../../shared/models';

@Component({
  selector: 'app-candidato-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h2>{{ esNuevo ? 'Nuevo candidato' : 'Editar candidato' }}</h2>
            <p class="subtitle">Los campos marcados con * son obligatorios</p>
          </div>
        </div>
        @if (!esNuevo) {
          <div class="acciones-candidato">
            <button mat-stroked-button color="primary" (click)="cambiarEstado('Seleccionado')" [disabled]="guardando()">
              <mat-icon>star</mat-icon> Seleccionar
            </button>
            <button mat-stroked-button color="warn" (click)="cambiarEstado('Descartado')" [disabled]="guardando()">
              <mat-icon>block</mat-icon> Descartar
            </button>
          </div>
        }
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">
          <!-- Vinculación -->
          <div class="card">
            <p class="section-title">Vinculación con solicitud</p>
            <mat-form-field appearance="outline">
              <mat-label>Solicitud aprobada *</mat-label>
              <mat-select formControlName="solicitudId">
                @for (s of solicitudes(); track s.Id) {
                  <mat-option [value]="s.Id">SOL-{{ s.Id }} · {{ s.Pefil_solicitado?.Cargo }}</mat-option>
                }
              </mat-select>
              <mat-hint>Solo se muestran solicitudes aprobadas</mat-hint>
            </mat-form-field>
          </div>

          <!-- Datos personales -->
          <div class="card">
            <p class="section-title">Datos personales</p>
            <div class="field-grid">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Nombre completo *</mat-label>
                <input matInput formControlName="nombre" placeholder="Nombres y apellidos" />
                @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                  <mat-error>El nombre es requerido</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Correo electrónico *</mat-label>
                <input matInput formControlName="correo" type="email" placeholder="correo@dominio.com" />
                @if (form.get('correo')?.hasError('email')) {
                  <mat-error>Formato de correo inválido</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Teléfono *</mat-label>
                <input matInput formControlName="telefono" placeholder="300 000 0000" />
              </mat-form-field>
            </div>
          </div>

          <!-- Hoja de vida -->
          <div class="card">
            <p class="section-title">Hoja de vida</p>
            <mat-form-field appearance="outline">
              <mat-label>URL del CV en SharePoint</mat-label>
              <input matInput formControlName="cvUrl" placeholder="https://empresa.sharepoint.com/..." />
              <mat-icon matSuffix>link</mat-icon>
              <mat-hint>Enlace directo al archivo en la biblioteca de documentos de SP</mat-hint>
            </mat-form-field>
          </div>

          <!-- Estado y seguimiento -->
          <div class="card">
            <p class="section-title">Estado y seguimiento</p>
            <div class="field-grid">
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="En proceso">En proceso</mat-option>
                  <mat-option value="Seleccionado">Seleccionado</mat-option>
                  <mat-option value="Descartado">Descartado</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="toggle-field">
                <label>Exámenes médicos y polígrafo</label>
                <mat-slide-toggle formControlName="examenesOk" color="primary">
                  {{ form.get('examenesOk')?.value ? 'Resultados OK' : 'Pendiente' }}
                </mat-slide-toggle>
              </div>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Notas del analista</mat-label>
                <textarea matInput formControlName="notas" rows="3"
                  placeholder="Observaciones, referencias, disponibilidad, pretensiones salariales...">
                </textarea>
              </mat-form-field>
            </div>
          </div>

          <!-- Acciones -->
          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
              @if (guardando()) { <mat-spinner diameter="18" /> } @else { Guardar candidato }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .acciones-candidato { display: flex; gap: 8px; }
    .toggle-field { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
    .toggle-field label { font-size: 12px; color: #5F6B7A; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `],
})
export class CandidatoFormComponent implements OnInit {
  private candidatosSvc  = inject(CandidatosService);
  private solicitudesSvc = inject(SolicitudesService);
  private notif          = inject(NotificacionService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private fb             = inject(FormBuilder);

  cargando  = signal(true);
  guardando = signal(false);
  solicitudes = signal<SolicitudItem[]>([]);
  esNuevo   = true;
  candidatoId: number | null = null;

  form = this.fb.group({
    solicitudId: [null as number | null, Validators.required],
    nombre:      ['', Validators.required],
    correo:      ['', [Validators.required, Validators.email]],
    telefono:    ['', Validators.required],
    cvUrl:       [''],
    estado:      ['En proceso'],
    examenesOk:  [false],
    notas:       [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.esNuevo = !id;
    this.candidatoId = id ? +id : null;

    this.solicitudesSvc.getAprobadas().subscribe(s => {
      this.solicitudes.set(s);
      if (!this.esNuevo && this.candidatoId) {
        this.candidatosSvc.getById(this.candidatoId).subscribe(c => {
          this.form.patchValue({
            solicitudId: c.ID_SolicitudId,
            nombre:      c.Nombre_Completo,
            correo:      c.Correo,
            telefono:    c.Telefono,
            cvUrl:       c.CV_URL?.Url ?? '',
            estado:      c.Estado,
            examenesOk:  c.Examenes_OK,
            notas:       c.Notas_Analista,
          });
          this.cargando.set(false);
        });
      } else {
        this.cargando.set(false);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;
    const data: any = {
      ID_SolicitudId: v.solicitudId,
      Nombre_Completo: v.nombre,
      Correo:   v.correo,
      Telefono: v.telefono,
      Estado:   v.estado,
      Examenes_OK: v.examenesOk,
      Notas_Analista: v.notas,
      ...(v.cvUrl ? { CV_URL: { Url: v.cvUrl, Description: 'Hoja de vida' } } : {}),
    };

    const obs = this.esNuevo
      ? this.candidatosSvc.create(data)
      : this.candidatosSvc.update(this.candidatoId!, data);

    obs.subscribe({
      next: () => {
        this.notif.exito(this.esNuevo ? 'Candidato registrado' : 'Candidato actualizado');
        this.guardando.set(false);
        this.volver();
      },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  cambiarEstado(estado: 'Seleccionado' | 'Descartado') {
    if (!this.candidatoId) return;
    this.guardando.set(true);
    this.candidatosSvc.cambiarEstado(this.candidatoId, estado).subscribe({
      next: () => {
        this.notif.exito(`Candidato marcado como ${estado}`);
        this.guardando.set(false);
        this.volver();
      },
      error: () => { this.notif.error('Error al cambiar estado'); this.guardando.set(false); },
    });
  }

  volver() { this.router.navigate(['/analista/candidatos']); }
}
