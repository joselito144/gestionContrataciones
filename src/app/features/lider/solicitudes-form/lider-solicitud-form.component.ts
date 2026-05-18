import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import { SolicitudesService, AreasService, PerfilesCargosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { AreaItem, PerfilCargoItem, NivelExcel, MotivoVacante } from '../../../shared/models';

@Component({
  selector: 'app-lider-solicitud-form',
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
            <h2>Nueva solicitud de personal</h2>
            <p class="subtitle">
              Formato GH-F-012 · Los campos marcados con * son obligatorios
            </p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- Perfil y área -->
          <div class="card">
            <p class="section-title">1. Información del perfil</p>
            <div class="field-grid">

              <mat-form-field appearance="outline">
                <mat-label>Perfil solicitado *</mat-label>
                <mat-select formControlName="perfilId">
                  @for (p of perfiles(); track p.Id) {
                    <mat-option [value]="p.Id">{{ p.Cargo }}</mat-option>
                  }
                </mat-select>
                <mat-hint>Selecciona del catálogo de perfiles/cargos</mat-hint>
                @if (form.get('perfilId')?.hasError('required') && form.get('perfilId')?.touched) {
                  <mat-error>El perfil es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Área solicitante *</mat-label>
                <mat-select formControlName="areaId">
                  @for (a of areas(); track a.Id) {
                    <mat-option [value]="a.Id">{{ a.Title }}</mat-option>
                  }
                </mat-select>
                @if (form.get('areaId')?.hasError('required') && form.get('areaId')?.touched) {
                  <mat-error>El área es requerida</mat-error>
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
                <mat-label>Nivel de Excel requerido</mat-label>
                <mat-select formControlName="pruebaExcel">
                  @for (n of nivelesExcel; track n) {
                    <mat-option [value]="n">{{ n }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

            </div>
          </div>

          <!-- Solicitante -->
          <div class="card">
            <p class="section-title">2. Solicitante</p>
            <div class="solicitante-row">
              <div class="avatar">{{ auth.iniciales() }}</div>
              <div>
                <div class="user-name">{{ auth.usuario()?.nombre }}</div>
                <div class="user-email">{{ auth.usuario()?.email }}</div>
                <div class="user-hint">Registrado automáticamente con tu usuario</div>
              </div>
            </div>
          </div>

          <!-- Cadena de aprobación -->
          <div class="card">
            <p class="section-title">3. Cadena de aprobación (automática)</p>
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

          <!-- Acciones -->
          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button
              mat-flat-button color="primary"
              type="submit"
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

    .solicitante-row {
      display: flex; align-items: flex-start; gap: 12px;
    }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 14px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .user-name  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .user-email { font-size: 12px; color: #9BA8B5; }
    .user-hint  { font-size: 11px; color: #B5D4F4; margin-top: 2px; }

    .aprov-chain {
      display: flex; align-items: center;
      gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
    }
    .aprov-step {
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
    }
    .aprov-step span { font-size: 10px; color: #9BA8B5; white-space: nowrap; }
    .aprov-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: #F4F6F9; border: 1.5px solid #D0D8E4;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 500; color: #5F6B7A;
    }
    .aprov-circle--pa {
      background: #EAF3DE; border-color: #1D9E75; color: #3B6D11;
    }
    .aprov-arrow { color: #D0D8E4; font-size: 18px !important; margin-top: -14px; }
    .aprov-hint { font-size: 11px; color: #9BA8B5; margin: 0; }

    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 8px; margin-top: 4px;
    }
  `],
})
export class LiderSolicitudFormComponent implements OnInit {
  private solicitudesSvc   = inject(SolicitudesService);
  private areasSvc         = inject(AreasService);
  private perfilesSvc      = inject(PerfilesCargosService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private fb               = inject(FormBuilder);
  auth                     = inject(AuthService);

  cargando  = signal(true);
  guardando = signal(false);
  areas     = signal<AreaItem[]>([]);
  perfiles  = signal<PerfilCargoItem[]>([]);
  fechaMinima = new Date();

  motivosVacante: MotivoVacante[] = [
    'Creación Cargo',
    'Renuncia',
    'Terminación Contrato',
    'Adición para Obra',
  ];

  nivelesExcel: NivelExcel[] = [
    'No Aplica',
    'Básica',
    'Intermedia',
    'Avanzada',
  ];

  form = this.fb.group({
    perfilId:             [null as number | null, Validators.required],
    areaId:               [null as number | null, Validators.required],
    motivoVacante:        ['' as MotivoVacante,   Validators.required],
    fechaRequeridaInicio: [null as Date | null,   Validators.required],
    pruebaExcel:          ['No Aplica' as NivelExcel],
  });

  ngOnInit() {
    forkJoin({
      areas:    this.areasSvc.getAll(),
      perfiles: this.perfilesSvc.getAll(),
    }).subscribe({
      next: ({ areas, perfiles }) => {
        this.areas.set(areas);
        this.perfiles.set(perfiles);
        this.cargando.set(false);
      },
      error: () => {
        this.notif.error('Error al cargar catálogos');
        this.cargando.set(false);
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);

    const v = this.form.value;
    const fecha = v.fechaRequeridaInicio as Date;

    this.solicitudesSvc.create({
      Pefil_solicitadoId:    v.perfilId!,
      AreaSolicitanteId:      v.areaId!,
      MotivoVacante:          v.motivoVacante!,
      FechaRequeridaInicio:   fecha.toISOString(),
      PruebaExcel:            v.pruebaExcel as NivelExcel,
    }).subscribe({
      next: () => {
        this.notif.exito(
          'Solicitud enviada. El flujo de aprobación ha iniciado automáticamente.'
        );
        this.guardando.set(false);
        this.router.navigate(['/lider/solicitudes']);
      },
      error: () => {
        this.notif.error('Error al guardar la solicitud');
        this.guardando.set(false);
      },
    });
  }

  volver() { this.router.navigate(['/lider/solicitudes']); }
}