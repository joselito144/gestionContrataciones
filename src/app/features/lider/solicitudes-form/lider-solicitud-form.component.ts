import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  SolicitudesService,
  AreasService,
  PerfilesCargosService,
  CentroCostosService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AreaItem, PerfilCargoItem, CentroCostoItem,
  NivelExcel, MotivoVacante, TipoContrato, UnidadDuracion,
} from '../../../shared/models';

@Component({
  selector: 'app-lider-solicitud-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>Nueva solicitud de personal</h2>
            <p class="subtitle">Formato GH-F-012 · Campos con * son obligatorios</p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- SECCIÓN 1: Identificación -->
          <div class="card">
            <p class="section-title">1. Identificación del requerimiento</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Perfil / cargo solicitado *</mat-label>
                <mat-select formControlName="perfilId">
                  @for (p of perfiles(); track p.Id) {
                    <mat-option [value]="p.Id">{{ p.Cargo }}</mat-option>
                  }
                </mat-select>
                @if (form.get('perfilId')?.hasError('required') && form.get('perfilId')?.touched) {
                  <mat-error>El perfil es requerido</mat-error>
                }
              </mat-form-field>

              <!-- Info del perfil seleccionado -->
              @if (perfilSeleccionado()) {
                <div class="perfil-info full">
                  <div class="perfil-info-item">
                    <span class="perfil-lbl">Competencias requeridas</span>
                    <span class="perfil-val">
                      {{ perfilSeleccionado()!.ComptenciasRequeridas || '—' }}
                    </span>
                  </div>
                  <div class="perfil-info-item">
                    <span class="perfil-lbl">Formación y conocimiento</span>
                    <span class="perfil-val">
                      {{ perfilSeleccionado()!.FormacionConocimiento || '—' }}
                    </span>
                  </div>
                </div>
              }

              <!-- Área — autocomplete -->
              <mat-form-field appearance="outline">
                <mat-label>Área solicitante *</mat-label>
                <input matInput formControlName="areaBusqueda"
                  [matAutocomplete]="autoArea"
                  placeholder="Escribe para buscar..." />
                <mat-autocomplete #autoArea="matAutocomplete"
                  [displayWith]="displayArea"
                  (optionSelected)="onAreaSelected($event.option.value)">
                  @for (a of areasFiltradas(); track a.Id) {
                    <mat-option [value]="a">{{ a.Title }}</mat-option>
                  }
                </mat-autocomplete>
                @if (form.get('areaId')?.hasError('required') && form.get('areaBusqueda')?.touched) {
                  <mat-error>El área es requerida</mat-error>
                }
              </mat-form-field>

              <!-- Centro de costos — autocomplete -->
              <mat-form-field appearance="outline">
                <mat-label>Centro de costos *</mat-label>
                <input matInput formControlName="centroBusqueda"
                  [matAutocomplete]="autoCentro"
                  placeholder="Buscar por código o nombre..." />
                <mat-autocomplete #autoCentro="matAutocomplete"
                  [displayWith]="displayCentro"
                  (optionSelected)="onCentroSelected($event.option.value)">
                  @for (c of centrosFiltrados(); track c.Id) {
                    <mat-option [value]="c">
                      <span class="centro-codigo">{{ c.Title }}</span>
                      <span class="centro-nombre"> — {{ c.NombreCentroCostos }}</span>
                    </mat-option>
                  }
                </mat-autocomplete>
                @if (form.get('centroCostoId')?.hasError('required') && form.get('centroBusqueda')?.touched) {
                  <mat-error>El centro de costos es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Motivo de la vacante *</mat-label>
                <mat-select formControlName="motivoVacante">
                  @for (m of motivosVacante; track m) {
                    <mat-option [value]="m">{{ m }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha requerida de inicio *</mat-label>
                <input matInput [matDatepicker]="picker"
                  formControlName="fechaRequeridaInicio"
                  [min]="fechaMinima" />
                <mat-datepicker-toggle matIconSuffix [for]="picker" />
                <mat-datepicker #picker />
                @if (form.get('fechaRequeridaInicio')?.hasError('required') && form.get('fechaRequeridaInicio')?.touched) {
                  <mat-error>La fecha de inicio es requerida</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Jefe inmediato *</mat-label>
                <input matInput formControlName="jefeInmediato"
                  placeholder="Nombre del jefe inmediato" />
                @if (form.get('jefeInmediato')?.hasError('required') && form.get('jefeInmediato')?.touched) {
                  <mat-error>El jefe inmediato es requerido</mat-error>
                }
              </mat-form-field>

            </div>
          </div>

          <!-- SECCIÓN 2: Condiciones del cargo -->
          <div class="card">
            <p class="section-title">2. Condiciones del cargo</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Rango salarial (COP) *</mat-label>
                <input matInput formControlName="rangoSalario"
                  placeholder="Ej: 2000000" />
                <span matPrefix>$&nbsp;</span>
                @if (form.get('rangoSalario')?.hasError('required') && form.get('rangoSalario')?.touched) {
                  <mat-error>El rango salarial es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nivel de Excel requerido</mat-label>
                <mat-select formControlName="pruebaExcel">
                  @for (n of nivelesExcel; track n) {
                    <mat-option [value]="n">{{ n }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="toggle-field">
                <label>¿Requiere trabajo en alturas vigente?</label>
                <mat-slide-toggle formControlName="trabajoAlturas" color="primary">
                  {{ form.get('trabajoAlturas')?.value ? 'Sí requerido' : 'No requerido' }}
                </mat-slide-toggle>
              </div>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Elementos necesarios para la contratación</mat-label>
                <textarea matInput formControlName="elementosNecesarios"
                  rows="2"
                  placeholder="EPP, equipos, herramientas, dotación...">
                </textarea>
              </mat-form-field>

            </div>
          </div>

          <!-- SECCIÓN 3: Tipo de contrato -->
          <div class="card">
            <p class="section-title">3. Tipo de contrato</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Tipo de contrato *</mat-label>
                <mat-select formControlName="tipoContrato">
                  @for (t of tiposContrato; track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Duración *</mat-label>
                <input matInput type="number" formControlName="duracionContrato" min="1" />
                @if (form.get('duracionContrato')?.hasError('required') && form.get('duracionContrato')?.touched) {
                  <mat-error>La duración es requerida</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Unidad de duración *</mat-label>
                <mat-select formControlName="unidadDuracion">
                  @for (u of unidadesDuracion; track u) {
                    <mat-option [value]="u">{{ u }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (mostrarObjetoObra()) {
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Definición del objeto / obra *</mat-label>
                  <textarea matInput formControlName="definicionObjetoObra"
                    rows="3"
                    placeholder="Describe el objeto o la obra contratada...">
                  </textarea>
                </mat-form-field>
              }

            </div>
          </div>

          <!-- SECCIÓN 4: Solicitante -->
          <div class="card">
            <p class="section-title">4. Solicitante</p>
            <div class="solicitante-row">
              <div class="avatar">{{ auth.iniciales() }}</div>
              <div>
                <div class="user-name">{{ auth.usuario()?.nombre }}</div>
                <div class="user-email">{{ auth.usuario()?.email }}</div>
                <div class="user-hint">Registrado automáticamente con tu usuario actual</div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 5: Cadena de aprobación -->
          <div class="card">
            <p class="section-title">5. Cadena de aprobación (automática)</p>
            <div class="aprov-chain">
              <div class="aprov-step">
                <div class="aprov-circle">1</div>
                <span>Líder del proceso</span>
              </div>
              <mat-icon class="aprov-arrow">arrow_forward</mat-icon>
              <div class="aprov-step">
                <div class="aprov-circle">2</div>
                <span>Director Administrativo</span>
              </div>
              <mat-icon class="aprov-arrow">arrow_forward</mat-icon>
              <div class="aprov-step">
                <div class="aprov-circle">3</div>
                <span>Gerente</span>
              </div>
              <mat-icon class="aprov-arrow">arrow_forward</mat-icon>
              <div class="aprov-step aprov-step--pa">
                <div class="aprov-circle aprov-circle--pa">
                  <mat-icon style="font-size:14px;width:14px;height:14px">auto_mode</mat-icon>
                </div>
                <span>Notifica Analista TH</span>
              </div>
            </div>
            <p class="aprov-hint">
              Al guardar, Power Automate inicia automáticamente el flujo de aprobación.
            </p>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || guardando()">
              @if (guardando()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>send</mat-icon> Enviar solicitud
              }
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .perfil-info {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      background: #E6F1FB; border-radius: 8px;
      padding: 12px 14px; border: 0.5px solid #B5D4F4;
    }
    .perfil-info-item { display: flex; flex-direction: column; gap: 3px; }
    .perfil-lbl {
      font-size: 10px; color: #185FA5;
      text-transform: uppercase; letter-spacing: .04em; font-weight: 500;
    }
    .perfil-val { font-size: 12px; color: #1E3A5F; white-space: pre-wrap; }

    .centro-codigo { font-weight: 500; color: #1E3A5F; }
    .centro-nombre { color: #9BA8B5; font-size: 12px; }

    .toggle-field {
      display: flex; flex-direction: column; gap: 8px;
      justify-content: center; padding: 8px 0;
    }
    .toggle-field label { font-size: 12px; color: #5F6B7A; font-weight: 500; }

    .solicitante-row { display: flex; align-items: flex-start; gap: 12px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 14px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .user-name  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .user-email { font-size: 12px; color: #9BA8B5; }
    .user-hint  { font-size: 11px; color: #B5D4F4; margin-top: 2px; }

    .aprov-chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .aprov-step  { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .aprov-step span { font-size: 10px; color: #9BA8B5; white-space: nowrap; }
    .aprov-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: #F4F6F9; border: 1.5px solid #D0D8E4;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 500; color: #5F6B7A;
    }
    .aprov-circle--pa { background: #EAF3DE; border-color: #1D9E75; color: #3B6D11; }
    .aprov-arrow { color: #D0D8E4; font-size: 18px !important; margin-top: -14px; }
    .aprov-hint  { font-size: 11px; color: #9BA8B5; margin: 0; }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class LiderSolicitudFormComponent implements OnInit {
  private solicitudesSvc  = inject(SolicitudesService);
  private areasSvc        = inject(AreasService);
  private perfilesSvc     = inject(PerfilesCargosService);
  private centrosSvc      = inject(CentroCostosService);
  private notif           = inject(NotificacionService);
  private router          = inject(Router);
  private fb              = inject(FormBuilder);
  auth                    = inject(AuthService);

  cargando  = signal(true);
  guardando = signal(false);
  areas     = signal<AreaItem[]>([]);
  perfiles  = signal<PerfilCargoItem[]>([]);
  centros   = signal<CentroCostoItem[]>([]);
  perfilSeleccionado = signal<PerfilCargoItem | null>(null);
  fechaMinima = new Date();

  motivosVacante:   MotivoVacante[]   = ['Creación Cargo','Renuncia','Terminación Contrato','Adición para Obra'];
  nivelesExcel:     NivelExcel[]      = ['No Aplica','Básica','Intermedia','Avanzada'];
  tiposContrato:    TipoContrato[]    = ['Término Indefinido','Término Fijo','Obra o Labor','Prestación Servicios','Aprendizaje'];
  unidadesDuracion: UnidadDuracion[]  = ['Días','Meses','Años'];

  form = this.fb.group({
    perfilId:             [null as number | null, Validators.required],
    areaBusqueda:         [''],
    areaId:               [null as number | null, Validators.required],
    centroBusqueda:       [''],
    centroCostoId:        [null as number | null, Validators.required],
    motivoVacante:        ['' as MotivoVacante,   Validators.required],
    fechaRequeridaInicio: [null as Date | null,   Validators.required],
    jefeInmediato:        ['', Validators.required],
    rangoSalario:         ['', Validators.required],
    pruebaExcel:          ['No Aplica' as NivelExcel],
    trabajoAlturas:       [false],
    elementosNecesarios:  [''],
    tipoContrato:         ['' as TipoContrato,    Validators.required],
    duracionContrato:     [null as number | null, [Validators.required, Validators.min(1)]],
    unidadDuracion:       ['Meses' as UnidadDuracion, Validators.required],
    definicionObjetoObra: [''],
  });

  // Convierte valueChanges en signal para que computed() reaccione
  private tipoContratoSignal = toSignal(
    this.form.get('tipoContrato')!.valueChanges,
    { initialValue: this.form.get('tipoContrato')!.value }
  );
  private areaBusquedaSignal = toSignal(
    this.form.get('areaBusqueda')!.valueChanges,
    { initialValue: '' }
  );
  private centroBusquedaSignal = toSignal(
    this.form.get('centroBusqueda')!.valueChanges,
    { initialValue: '' }
  );

  mostrarObjetoObra = computed(() => {
    const tipo = this.tipoContratoSignal();
    return tipo === 'Obra o Labor' || tipo === 'Prestación Servicios';
  });

  areasFiltradas = computed(() => {
    const texto = (this.areaBusquedaSignal() ?? '').toLowerCase();
    if (!texto || typeof texto !== 'string') return this.areas();
    return this.areas().filter(a => a.Title.toLowerCase().includes(texto));
  });

  centrosFiltrados = computed(() => {
    const texto = (this.centroBusquedaSignal() ?? '').toLowerCase();
    if (!texto || typeof texto !== 'string') return this.centros();
    return this.centros().filter(c =>
      c.Title.toLowerCase().includes(texto) ||
      c.NombreCentroCostos.toLowerCase().includes(texto)
    );
  });

  ngOnInit() {
    forkJoin({
      areas:    this.areasSvc.getAll(),
      perfiles: this.perfilesSvc.getAll(),
      centros:  this.centrosSvc.getAll(),
    }).subscribe({
      next: ({ areas, perfiles, centros }) => {
        this.areas.set(areas);
        this.perfiles.set(perfiles);
        this.centros.set(centros);
        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar catálogos'); this.cargando.set(false); },
    });

    // Actualiza el perfil seleccionado al cambiar el select
    this.form.get('perfilId')?.valueChanges.subscribe(id => {
      const perfil = this.perfiles().find(p => p.Id === id) ?? null;
      this.perfilSeleccionado.set(perfil);
    });

    // Limpia objeto/obra si cambia a tipo que no lo requiere
    this.form.get('tipoContrato')?.valueChanges.subscribe(tipo => {
      if (tipo !== 'Obra o Labor' && tipo !== 'Prestación Servicios') {
        this.form.get('definicionObjetoObra')?.setValue('');
      }
    });
  }

  displayArea(area: AreaItem | string): string {
    if (!area) return '';
    return typeof area === 'string' ? area : area.Title;
  }

  displayCentro(centro: CentroCostoItem | string): string {
    if (!centro) return '';
    return typeof centro === 'string' ? centro : `${centro.Title} — ${centro.NombreCentroCostos}`;
  }

  onAreaSelected(area: AreaItem) {
    this.form.patchValue({ areaId: area.Id, areaBusqueda: area.Title });
  }

  onCentroSelected(centro: CentroCostoItem) {
    this.form.patchValue({
      centroCostoId: centro.Id,
      centroBusqueda: `${centro.Title} — ${centro.NombreCentroCostos}`,
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;
    const fecha = v.fechaRequeridaInicio as Date;

    this.solicitudesSvc.create({
      Pefil_solicitadoId:     v.perfilId!,
      AreaSolicitanteId:      v.areaId!,
      CentroCostoId:          v.centroCostoId!,
      MotivoVacante:          v.motivoVacante!,
      FechaRequeridaInicio:   fecha.toISOString(),
      JefeInmediato:          v.jefeInmediato!,
      RangoSalario:           v.rangoSalario!,
      PruebaExcel:            v.pruebaExcel as NivelExcel,
      TrabajoAlturasVigente:  v.trabajoAlturas ?? false,
      ElementosNecesarios:    v.elementosNecesarios ?? '',
      TipoContrato:           v.tipoContrato!,
      DuracionContrato:       v.duracionContrato!,
      UnidadDuracionContrato: v.unidadDuracion!,
      DefinicionObjetoObra:   v.definicionObjetoObra ?? '',
      SolicitanteId:          this.auth.usuario()!.id,
    }).subscribe({
      next: () => {
        this.notif.exito('Solicitud enviada. El flujo de aprobación ha iniciado.');
        this.guardando.set(false);
        this.router.navigate(['/lider/solicitudes']);
      },
      error: () => { this.notif.error('Error al guardar la solicitud'); this.guardando.set(false); },
    });
  }

  volver() { this.router.navigate(['/lider/solicitudes']); }
}