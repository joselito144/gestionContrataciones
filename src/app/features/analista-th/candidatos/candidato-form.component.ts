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
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PnpConfigService } from '../../../core/services/pnp.config';
import { TipoIdentificacion } from '../../../shared/models';
import '@pnp/sp/attachments';

@Component({
  selector: 'app-candidato-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
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
            <p class="subtitle">Datos maestros del candidato</p>
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

          <!-- Contacto -->
          <div class="card">
            <p class="section-title">2. Datos de contacto</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Correo electrónico *</mat-label>
                <input matInput formControlName="correo" type="email" />
                @if (form.get('correo')?.hasError('email') && form.get('correo')?.touched) {
                  <mat-error>Formato inválido</mat-error>
                }
                @if (form.get('correo')?.hasError('required') && form.get('correo')?.touched) {
                  <mat-error>El correo es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Teléfono *</mat-label>
                <input matInput formControlName="telefono" />
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

          <!-- Hoja de vida -->
          <div class="card">
            <p class="section-title">3. Hoja de vida</p>
            @if (esNuevo) {
              <div class="cv-info">
                <mat-icon>info_outline</mat-icon>
                <p>Guarda primero el candidato. Una vez creado el registro podrás adjuntar la hoja de vida desde el botón de edición.</p>
              </div>
            } @else {
              <div class="cv-upload-area">
                <input #fileInput type="file"
                  accept=".pdf,.doc,.docx"
                  style="display:none"
                  (change)="onFileSelected($event)" />

                @if (!archivoSeleccionado()) {
                  <div class="cv-dropzone" (click)="fileInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    <p><strong>Seleccionar hoja de vida</strong></p>
                    <p class="hint">PDF, DOC o DOCX · El archivo quedará adjunto al registro del candidato en SharePoint</p>
                  </div>
                } @else {
                  <div class="cv-preview">
                    <mat-icon class="file-icon">description</mat-icon>
                    <div class="file-info">
                      <div class="file-name">{{ archivoSeleccionado()!.name }}</div>
                      <div class="file-size">{{ formatSize(archivoSeleccionado()!.size) }}</div>
                    </div>
                    <button mat-icon-button color="warn"
                      type="button"
                      matTooltip="Quitar archivo"
                      (click)="limpiarArchivo(fileInput)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }

                @if (subiendoCV()) {
                  <div class="cv-uploading">
                    <mat-spinner diameter="20" />
                    <span>Adjuntando hoja de vida...</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Notas -->
          <div class="card">
            <p class="section-title">4. Observaciones del analista</p>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Notas generales</mat-label>
              <textarea matInput formControlName="notas" rows="3"
                placeholder="Observaciones generales sobre el candidato...">
              </textarea>
            </mat-form-field>
          </div>

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

    .cv-info {
      display: flex; align-items: flex-start; gap: 10px;
      background: #E6F1FB; border-radius: 8px; padding: 12px 14px;
    }
    .cv-info mat-icon { color: #185FA5; flex-shrink: 0; }
    .cv-info p { margin: 0; font-size: 13px; color: #1E3A5F; }

    .cv-upload-area { display: flex; flex-direction: column; gap: 10px; }
    .cv-dropzone {
      border: 2px dashed #D0D8E4; border-radius: 8px;
      padding: 28px; text-align: center; cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .cv-dropzone:hover { border-color: #378ADD; background: #F4F6F9; }
    .cv-dropzone mat-icon { font-size: 36px; width: 36px; height: 36px; color: #D0D8E4; }
    .cv-dropzone p { margin: 6px 0 0; font-size: 13px; color: #5F6B7A; }
    .cv-dropzone .hint { font-size: 11px; color: #9BA8B5; }

    .cv-preview {
      display: flex; align-items: center; gap: 12px;
      background: #EAF3DE; border-radius: 8px; padding: 12px 14px;
      border: 0.5px solid #97C459;
    }
    .file-icon { color: #3B6D11; font-size: 28px; width: 28px; height: 28px; }
    .file-info  { flex: 1; }
    .file-name  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .file-size  { font-size: 11px; color: #9BA8B5; }

    .cv-uploading {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: #5F6B7A; padding: 8px 0;
    }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class CandidatoFormComponent implements OnInit {
  private svc    = inject(CandidatosService);
  private notif  = inject(NotificacionService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private fb     = inject(FormBuilder);
  private pnp    = inject(PnpConfigService);

  cargando          = signal(true);
  guardando         = signal(false);
  subiendoCV        = signal(false);
  archivoSeleccionado = signal<File | null>(null);
  esNuevo           = true;
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
    this.esNuevo     = !id;
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.archivoSeleccionado.set(file);
  }

  limpiarArchivo(input: HTMLInputElement) {
    input.value = '';
    this.archivoSeleccionado.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async adjuntarCV(candidatoId: number): Promise<void> {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.subiendoCV.set(true);
    try {
      const buffer = await file.arrayBuffer();
      await this.pnp.sp.web
        .lists.getByTitle('Candidatos')
        .items.getById(candidatoId)
        .attachmentFiles.add(file.name, buffer);
    } catch (e) {
      console.error('Error adjuntando CV:', e);
      this.notif.advertencia('El candidato fue guardado pero no se pudo adjuntar la hoja de vida. Intenta subirla desde el visor de documentos.');
    } finally {
      this.subiendoCV.set(false);
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
      next: async (res) => {
        // Si es nuevo y hay archivo, adjuntar al ítem recién creado
        const nuevoId = this.esNuevo ? res?.data?.Id : this.candidatoId;
        if (nuevoId && this.archivoSeleccionado()) {
          await this.adjuntarCV(nuevoId);
        }
        this.notif.exito(this.esNuevo ? 'Candidato registrado' : 'Candidato actualizado');
        this.guardando.set(false);
        this.volver();
      },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  volver() { this.router.navigate(['/analista/candidatos']); }
}