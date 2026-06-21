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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PnpConfigService } from '../../../core/services/pnp.config';
import {
  TipoIdentificacion, EstadoCivil, Escolaridad,
  GrupoSanguineo, TipoVivienda, EPS, FondoPension, Banco,
} from '../../../shared/models';
import '@pnp/sp/attachments';

@Component({
  selector: 'app-candidato-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
    MatTabsModule, MatDividerModule,
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
              @if (!esNuevo) {
                {{ form.get('nombre')?.value }}
              } @else {
                Datos del candidato
              }
            </p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">
          <mat-tab-group animationDuration="150ms">

            <!-- TAB 1: Datos básicos -->
            <mat-tab label="Datos básicos">
              <div class="tab-content">

                <div class="card">
                  <p class="section-title">Identificación</p>
                  <div class="field-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de identificación *</mat-label>
                      <mat-select formControlName="tipoIdentificacion">
                        @for (t of tiposId; track t) {
                          <mat-option [value]="t">{{ t }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Número de identificación *</mat-label>
                      <input matInput formControlName="numeroIdentificacion" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Fecha de expedición</mat-label>
                      <input matInput [matDatepicker]="pickerExp"
                        formControlName="fechaExpedicionDoc" />
                      <mat-datepicker-toggle matIconSuffix [for]="pickerExp" />
                      <mat-datepicker #pickerExp />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Ciudad de expedición</mat-label>
                      <input matInput formControlName="ciudadExpedicionDoc" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full">
                      <mat-label>Nombre completo *</mat-label>
                      <input matInput formControlName="nombre" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Fecha de nacimiento</mat-label>
                      <input matInput [matDatepicker]="pickerNac"
                        formControlName="fechaNacimiento" />
                      <mat-datepicker-toggle matIconSuffix [for]="pickerNac" />
                      <mat-datepicker #pickerNac />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Ciudad de nacimiento</mat-label>
                      <input matInput formControlName="ciudadNacimiento" />
                    </mat-form-field>
                  </div>
                </div>

                <div class="card">
                  <p class="section-title">Datos de contacto</p>
                  <div class="field-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Correo electrónico *</mat-label>
                      <input matInput formControlName="correo" type="email" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Teléfono *</mat-label>
                      <input matInput formControlName="telefono" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Dirección *</mat-label>
                      <input matInput formControlName="direccion" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Barrio</mat-label>
                      <input matInput formControlName="barrio" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Estrato</mat-label>
                      <mat-select formControlName="estrato">
                        @for (e of [1,2,3,4,5,6]; track e) {
                          <mat-option [value]="e">{{ e }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de vivienda</mat-label>
                      <mat-select formControlName="tipoVivienda">
                        @for (t of tiposVivienda; track t) {
                          <mat-option [value]="t">{{ t }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="card">
                  <p class="section-title">Información personal</p>
                  <div class="field-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Estado civil</mat-label>
                      <mat-select formControlName="estadoCivil">
                        @for (e of estadosCiviles; track e) {
                          <mat-option [value]="e">{{ e }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Escolaridad</mat-label>
                      <mat-select formControlName="escolaridad">
                        @for (e of escolaridades; track e) {
                          <mat-option [value]="e">{{ e }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Grupo sanguíneo</mat-label>
                      <mat-select formControlName="grupoSanguineo">
                        @for (g of gruposSanguineos; track g) {
                          <mat-option [value]="g">{{ g }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="card">
                  <p class="section-title">Seguridad social y datos bancarios</p>
                  <div class="field-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>EPS</mat-label>
                      <mat-select formControlName="eps">
                        @for (e of epsOpciones; track e) {
                          <mat-option [value]="e">{{ e }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Fondo de pensiones</mat-label>
                      <mat-select formControlName="pension">
                        @for (p of fondosPension; track p) {
                          <mat-option [value]="p">{{ p }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Banco</mat-label>
                      <mat-select formControlName="banco">
                        @for (b of bancos; track b) {
                          <mat-option [value]="b">{{ b }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Número de cuenta</mat-label>
                      <input matInput formControlName="numeroCuenta" />
                    </mat-form-field>
                  </div>
                </div>

                <div class="card">
                  <p class="section-title">Observaciones del analista</p>
                  <mat-form-field appearance="outline" style="width:100%">
                    <mat-label>Notas generales</mat-label>
                    <textarea matInput formControlName="notas" rows="3"
                      placeholder="Observaciones generales sobre el candidato...">
                    </textarea>
                  </mat-form-field>
                </div>

              </div>
            </mat-tab>

            <!-- TAB 2: Hoja de vida -->
            <mat-tab label="Hoja de vida" [disabled]="esNuevo">
              <div class="tab-content">
                @if (esNuevo) {
                  <div class="card info-card">
                    <mat-icon>info_outline</mat-icon>
                    <p>Guarda primero el candidato para poder adjuntar documentos.</p>
                  </div>
                } @else {
                  <div class="card">
                    <p class="section-title">Adjuntar hoja de vida</p>
                    <p class="hint-text">
                      El archivo quedará como adjunto nativo del registro en SharePoint
                      y será visible a través del visor de documentos.
                    </p>

                    <input #fileInput type="file"
                      accept=".pdf,.doc,.docx"
                      style="display:none"
                      (change)="onFileSelected($event)" />

                    @if (!archivoSeleccionado()) {
                      <div class="cv-dropzone" (click)="fileInput.click()">
                        <mat-icon>upload_file</mat-icon>
                        <p><strong>Seleccionar archivo</strong></p>
                        <p class="hint">PDF, DOC o DOCX</p>
                      </div>
                    } @else {
                      <div class="cv-preview">
                        <mat-icon class="file-icon">description</mat-icon>
                        <div class="file-info">
                          <div class="file-name">{{ archivoSeleccionado()!.name }}</div>
                          <div class="file-size">{{ formatSize(archivoSeleccionado()!.size) }}</div>
                        </div>
                        <button mat-icon-button color="warn" type="button"
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
            </mat-tab>

          </mat-tab-group>

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
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 0; }
    .hint-text { font-size: 12px; color: #9BA8B5; margin-bottom: 16px; }

    .info-card {
      display: flex; gap: 10px; align-items: flex-start;
      background: #E6F1FB; border-color: #B5D4F4;
    }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; }
    .info-card p { margin: 0; font-size: 13px; color: #1E3A5F; }

    .cv-dropzone {
      border: 2px dashed #D0D8E4; border-radius: 8px;
      padding: 28px; text-align: center; cursor: pointer;
      transition: border-color .15s;
    }
    .cv-dropzone:hover { border-color: #378ADD; background: #F4F6F9; }
    .cv-dropzone mat-icon { font-size: 36px; width: 36px; height: 36px; color: #D0D8E4; }
    .cv-dropzone p { margin: 6px 0 0; font-size: 13px; color: #5F6B7A; }
    .cv-dropzone .hint { font-size: 11px; color: #9BA8B5; }

    .cv-preview {
      display: flex; align-items: center; gap: 12px;
      background: #EAF3DE; border-radius: 8px;
      padding: 12px 14px; border: 0.5px solid #97C459;
    }
    .file-icon { color: #3B6D11; font-size: 28px; width: 28px; height: 28px; }
    .file-info  { flex: 1; }
    .file-name  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .file-size  { font-size: 11px; color: #9BA8B5; }

    .cv-uploading {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: #5F6B7A; padding: 8px 0;
    }

    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 8px; margin-top: 16px;
    }
  `],
})
export class CandidatoFormComponent implements OnInit {
  private svc = inject(CandidatosService);
  private notif = inject(NotificacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private pnp = inject(PnpConfigService);

  cargando = signal(true);
  guardando = signal(false);
  subiendoCV = signal(false);
  archivoSeleccionado = signal<File | null>(null);
  esNuevo = true;
  candidatoId: number | null = null;

  // Catálogos
  tiposId: TipoIdentificacion[] = ['CC', 'CE', 'PA', 'NIT', 'Otro'];
  estadosCiviles: EstadoCivil[] = ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)'];
  escolaridades: Escolaridad[] = ['Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];
  gruposSanguineos: GrupoSanguineo[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  tiposVivienda: TipoVivienda[] = ['Propia', 'Arrendada', 'Familiar', 'Otra'];
  epsOpciones: EPS[] = ['Sura', 'Sanitas', 'Nueva EPS', 'Compensar', 'Coomeva', 'Salud Total', 'Famisanar', 'Medimás', 'Coosalud', 'Mutual Ser', 'Otra'];
  fondosPension: FondoPension[] = ['Colpensiones', 'Porvenir', 'Protección', 'Colfondos', 'Old Mutual', 'Skandia', 'Otra'];
  bancos: Banco[] = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco Popular', 'Banco de Occidente', 'Banco AV Villas', 'Banco Caja Social', 'Nequi', 'Daviplata', 'Scotiabank Colpatria', 'Itaú', 'Otro'];

  form = this.fb.group({
    // Datos básicos (obligatorios)
    tipoIdentificacion: ['' as TipoIdentificacion, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    direccion: ['', Validators.required],
    notas: [''],
    // Identificación adicional — AHORA OPCIONALES
    fechaExpedicionDoc: [null as Date | null],   // sin Validators.required
    ciudadExpedicionDoc: [''],                     // sin Validators.required
    fechaNacimiento: [null as Date | null],   // sin Validators.required
    ciudadNacimiento: [''],                     // sin Validators.required
    // Personal
    estadoCivil: [null as EstadoCivil | null],
    escolaridad: [null as Escolaridad | null],
    grupoSanguineo: [null as GrupoSanguineo | null],
    tipoVivienda: [null as TipoVivienda | null],
    estrato: [null as number | null],
    barrio: [''],
    // Seguridad social
    eps: [null as EPS | null],
    pension: [null as FondoPension | null],
    // Bancario
    banco: [null as Banco | null],
    numeroCuenta: [''],
  });


  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.esNuevo = !id;
    this.candidatoId = id ? +id : null;

    if (!this.esNuevo && this.candidatoId) {
      this.svc.getById(this.candidatoId).subscribe({
        next: c => {
          this.form.patchValue({
            tipoIdentificacion: c.TipoIdentificacion,
            numeroIdentificacion: c.NumeroIdentificacion,
            nombre: c.Nombre_Completo,
            correo: c.Correo,
            telefono: c.Telefono,
            direccion: c.Direccion,
            notas: c.Notas_Analista,
            fechaExpedicionDoc: c.FechaExpedicionDoc ? new Date(c.FechaExpedicionDoc) : null,
            ciudadExpedicionDoc: c.CiudadExpedicionDoc,
            fechaNacimiento: c.FechaNacimiento ? new Date(c.FechaNacimiento) : null,
            ciudadNacimiento: c.CiudadNacimiento,
            estadoCivil: c.EstadoCivil,
            escolaridad: c.Escolaridad,
            grupoSanguineo: c.GrupoSanguineo,
            tipoVivienda: c.TipoVivienda,
            estrato: c.Estrato,
            barrio: c.Barrio,
            eps: c.EPS,
            pension: c.Pension,
            banco: c.Banco,
            numeroCuenta: c.NumeroCuenta,
          });
          this.cargando.set(false);
        },
        error: () => {
          this.notif.error('Error al cargar el candidato');
          this.cargando.set(false);
        },
      });
    } else {
      this.cargando.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado.set(input.files?.[0] ?? null);
  }

  limpiarArchivo(input: HTMLInputElement) {
    input.value = '';
    this.archivoSeleccionado.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async adjuntarCV(id: number): Promise<void> {
    const file = this.archivoSeleccionado();
    if (!file) return;
    this.subiendoCV.set(true);
    try {
      const buffer = await file.arrayBuffer();
      await this.pnp.sp.web
        .lists.getByTitle('Candidatos')
        .items.getById(id)
        .attachmentFiles.add(file.name, buffer);
    } catch (e) {
      this.notif.advertencia('Candidato guardado pero no se pudo adjuntar el CV. Intenta desde el visor.');
    } finally {
      this.subiendoCV.set(false);
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;

    const data: any = {
      Nombre_Completo: v.nombre,
      TipoIdentificacion: v.tipoIdentificacion,
      NumeroIdentificacion: v.numeroIdentificacion,
      Correo: v.correo,
      Telefono: v.telefono,
      Direccion: v.direccion,
      Notas_Analista: v.notas ?? '',
      FechaExpedicionDoc: v.fechaExpedicionDoc ? (v.fechaExpedicionDoc as Date).toISOString() : null,
      CiudadExpedicionDoc: v.ciudadExpedicionDoc ?? '',
      FechaNacimiento: v.fechaNacimiento ? (v.fechaNacimiento as Date).toISOString() : null,
      CiudadNacimiento: v.ciudadNacimiento ?? '',
      EstadoCivil: v.estadoCivil,
      Escolaridad: v.escolaridad,
      GrupoSanguineo: v.grupoSanguineo,
      TipoVivienda: v.tipoVivienda,
      Estrato: v.estrato,
      Barrio: v.barrio ?? '',
      EPS: v.eps,
      Pension: v.pension,
      Banco: v.banco,
      NumeroCuenta: v.numeroCuenta ?? '',
    };

    const obs = this.esNuevo
      ? this.svc.create(data)
      : this.svc.update(this.candidatoId!, data);

    obs.subscribe({
      next: async (res) => {
        const id = this.esNuevo ? res?.data?.Id : this.candidatoId;
        if (id && this.archivoSeleccionado()) {
          await this.adjuntarCV(id);
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