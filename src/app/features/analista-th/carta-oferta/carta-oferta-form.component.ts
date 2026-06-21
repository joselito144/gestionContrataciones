import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import {
  ParticipacionesService,
  SolicitudesService,
  CandidatosService,
  OfertasService,
} from '../../../core/services/domain';
import { KpiOfertasService } from '../../../core/services/domain/kpi-ofertas.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  ParticipacionItem, SolicitudItem, CandidatoItem,
  UnidadPeriodoKPI,
} from '../../../shared/models';

@Component({
  selector: 'app-carta-oferta-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatTableModule, MatTooltipModule,
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
            @if (candidato() && solicitud()) {
              <p class="subtitle">
                {{ candidato()!.Nombre_Completo }} ·
                {{ solicitud()!.Pefil_solicitado?.Cargo }}
              </p>
            }
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {

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
              <span class="val">{{ solicitud()?.FechaRequeridaInicio | date:'dd/MM/yyyy' }}</span>
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

          <div class="card">
            <p class="section-title">Condiciones ofertadas</p>
            <div class="field-grid">
              <mat-form-field appearance="outline">
                <mat-label>Cargo ofertado *</mat-label>
                <input matInput formControlName="cargo" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Salario mensual (COP) *</mat-label>
                <input matInput type="number" formControlName="salario" min="1" />
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio *</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="fechaInicio" />
                <mat-datepicker-toggle matIconSuffix [for]="picker" />
                <mat-datepicker #picker />
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
                <textarea matInput formControlName="observaciones" rows="3"></textarea>
              </mat-form-field>
            </div>
          </div>

          <!-- KPIs -->
          <div class="card">
            <div class="kpi-header">
              <p class="section-title" style="margin:0">Cumplimiento por KPI</p>
              <mat-slide-toggle formControlName="aplicaKPI" color="primary">
                {{ form.get('aplicaKPI')?.value ? 'Aplica para este cargo' : 'No aplica para este cargo' }}
              </mat-slide-toggle>
            </div>

            @if (form.get('aplicaKPI')?.value) {
              <div class="kpi-body">
                <mat-form-field appearance="outline" style="width:280px;margin-bottom:16px">
                  <mat-label>Valor mensual del KPI (COP) *</mat-label>
                  <input matInput type="number" formControlName="valorKPI" min="1" />
                  <span matPrefix>$&nbsp;</span>
                </mat-form-field>

                <p class="kpi-sub-title">Períodos de garantía</p>

                <table class="kpi-table">
                  <thead>
                    <tr><th>Período N°</th><th>Unidad</th><th>% Garantizado</th><th></th></tr>
                  </thead>
                  <tbody>
                    @for (periodo of periodosArray.controls; track $index; let i = $index) {
                      <tr [formGroup]="getPeriodoGroup(i)">
                        <td><div class="periodo-num">{{ i + 1 }}</div></td>
                        <td>
                          <mat-form-field appearance="outline" class="td-field">
                            <mat-select formControlName="unidad">
                              @for (u of unidadesPeriodo; track u) {
                                <mat-option [value]="u">{{ u }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        </td>
                        <td>
                          <mat-form-field appearance="outline" class="td-field">
                            <input matInput type="number" formControlName="porcentaje" min="0" max="100" />
                            <span matSuffix>%</span>
                          </mat-form-field>
                        </td>
                        <td>
                          <button mat-icon-button color="warn" type="button"
                            [disabled]="periodosArray.length === 1"
                            (click)="eliminarPeriodo(i)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>

                <button mat-stroked-button type="button" style="margin-top:12px" (click)="agregarPeriodo()">
                  <mat-icon>add</mat-icon> Agregar período
                </button>
              </div>
            }
          </div>

          <div class="card info-card">
            <mat-icon>info_outline</mat-icon>
            <div>
              <p><strong>Al guardar esta carta oferta:</strong></p>
              <ul>
                <li>Se crea el registro en Ofertas de SharePoint</li>
                @if (form.get('aplicaKPI')?.value) {
                  <li>Se guardan {{ periodosArray.length }} período(s) de KPI</li>
                }
                <li>Power Automate genera el PDF y gestiona la aprobación</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || guardando()">
              @if (guardando()) { <mat-spinner diameter="18" /> }
              @else { <mat-icon>description</mat-icon> Generar carta oferta }
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .resumen-card { background: #F4F6F9; }
    .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .resumen-item { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 11px; color: #9BA8B5; text-transform: uppercase; letter-spacing: .04em; }
    .val { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .sub { font-size: 11px; color: #9BA8B5; }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-sub-title { font-size: 12px; font-weight: 500; color: #1E3A5F; margin: 0 0 4px; }
    .kpi-table {
      width: 100%; border-collapse: collapse;
      border: 0.5px solid #D0D8E4; border-radius: 8px; overflow: hidden;
    }
    .kpi-table th {
      background: #F4F6F9; font-size: 11px; font-weight: 500;
      color: #9BA8B5; text-transform: uppercase; padding: 10px 12px; text-align: left;
      border-bottom: 0.5px solid #D0D8E4;
    }
    .kpi-table td { padding: 6px 12px; border-bottom: 0.5px solid #F4F6F9; vertical-align: middle; }
    .periodo-num {
      width: 28px; height: 28px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 500;
    }
    .td-field { width: 140px; }
    ::ng-deep .td-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .info-card { display: flex; gap: 12px; background: #E6F1FB; border-color: #B5D4F4; }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p  { margin: 0 0 8px; font-size: 13px; color: #1E3A5F; }
    .info-card ul { margin: 0; padding-left: 20px; font-size: 12px; color: #5F6B7A; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
  `],
})
export class CartaOfertaFormComponent implements OnInit {
  private participacionSvc = inject(ParticipacionesService);
  private solicitudesSvc   = inject(SolicitudesService);
  private candidatosSvc    = inject(CandidatosService);
  private ofertasSvc       = inject(OfertasService);
  private kpiSvc           = inject(KpiOfertasService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private route            = inject(ActivatedRoute);
  private fb               = inject(FormBuilder);

  cargando      = signal(true);
  guardando     = signal(false);
  participacion = signal<ParticipacionItem | null>(null);
  solicitud     = signal<SolicitudItem | null>(null);
  candidato     = signal<CandidatoItem | null>(null);

  unidadesPeriodo: UnidadPeriodoKPI[] = ['Mes', 'Trimestre', 'Semestre'];

  form = this.fb.group({
    cargo:         ['', Validators.required],
    salario:       [null as number | null, [Validators.required, Validators.min(1)]],
    fechaInicio:   [null as Date | null, Validators.required],
    tipoContrato:  ['', Validators.required],
    observaciones: [''],
    aplicaKPI:     [false],
    // valorKPI SIN Validators.required aquí — se valida condicionalmente abajo
    valorKPI:      [null as number | null],
    periodos:      this.fb.array([this.crearPeriodoGroup()]),
  });

  get periodosArray(): FormArray { return this.form.get('periodos') as FormArray; }
  getPeriodoGroup(i: number): FormGroup { return this.periodosArray.at(i) as FormGroup; }

  // Los controles del período YA NO tienen Validators.required fijos.
  // Se activan/desactivan dinámicamente según el estado de aplicaKPI.
  private crearPeriodoGroup(): FormGroup {
    return this.fb.group({
      unidad:     ['Mes' as UnidadPeriodoKPI],
      porcentaje: [null as number | null, [Validators.min(0), Validators.max(100)]],
    });
  }

  agregarPeriodo() {
    const nuevo = this.crearPeriodoGroup();
    if (this.form.get('aplicaKPI')?.value) {
      this.activarValidacionPeriodo(nuevo);
    }
    this.periodosArray.push(nuevo);
  }

  eliminarPeriodo(i: number) {
    if (this.periodosArray.length > 1) this.periodosArray.removeAt(i);
  }

  private activarValidacionPeriodo(grupo: FormGroup) {
    grupo.get('unidad')?.setValidators([Validators.required]);
    grupo.get('porcentaje')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    grupo.get('unidad')?.updateValueAndValidity();
    grupo.get('porcentaje')?.updateValueAndValidity();
  }

  private desactivarValidacionPeriodo(grupo: FormGroup) {
    grupo.get('unidad')?.clearValidators();
    grupo.get('porcentaje')?.clearValidators();
    grupo.get('unidad')?.updateValueAndValidity();
    grupo.get('porcentaje')?.updateValueAndValidity();
  }

  ngOnInit() {
    // FIX PRINCIPAL: la validación de KPI (valorKPI + cada período) se activa
    // o desactiva dinámicamente según el toggle "aplicaKPI". Antes, los
    // validadores quedaban fijos y bloqueaban el formulario aunque el toggle
    // estuviera apagado, impidiendo generar ofertas sin KPI.
    this.form.get('aplicaKPI')?.valueChanges.subscribe(aplica => {
      const valorKPICtrl = this.form.get('valorKPI');

      if (aplica) {
        valorKPICtrl?.setValidators([Validators.required, Validators.min(1)]);
        this.periodosArray.controls.forEach(ctrl => this.activarValidacionPeriodo(ctrl as FormGroup));
      } else {
        valorKPICtrl?.clearValidators();
        valorKPICtrl?.setValue(null);
        this.periodosArray.controls.forEach(ctrl => this.desactivarValidacionPeriodo(ctrl as FormGroup));
      }
      valorKPICtrl?.updateValueAndValidity();
    });

    const participacionId = +this.route.snapshot.paramMap.get('id')!;

    this.participacionSvc.getById(participacionId).subscribe({
      next: participacion => {
        this.participacion.set(participacion);
        forkJoin({
          solicitud: this.solicitudesSvc.getById(
            participacion.SolicitudId ?? participacion.Solicitud?.Id!
          ),
          candidato: this.candidatosSvc.getById(
            participacion.CandidatoId ?? participacion.Candidato?.Id!
          ),
        }).subscribe({
          next: ({ solicitud, candidato }) => {
            this.solicitud.set(solicitud);
            this.candidato.set(candidato);
            this.form.patchValue({
              cargo:        solicitud.Pefil_solicitado?.Cargo ?? '',
              tipoContrato: solicitud.TipoContrato ?? '',
            });
            this.cargando.set(false);
          },
          error: () => { this.notif.error('Error al cargar datos del proceso'); this.cargando.set(false); },
        });
      },
      error: () => { this.notif.error('Error al cargar la participación'); this.cargando.set(false); },
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;

    const ofertaData = {
      ID_ParticipacionId: this.participacion()!.Id,
      Salario_Ofertado:   v.salario!,
      Cargo:              v.cargo!,
      Estado_Oferta:      'Enviada' as const,
      Aprobada_DirAdm:    false,
      AplicaKPI:          v.aplicaKPI ?? false,
    };

    this.ofertasSvc.create(ofertaData).subscribe({
      next: (res) => {
        const ofertaId =
          res?.data?.Id ?? res?.Id ?? res?.data?.ID ?? res?.ID ?? null;

        if (!ofertaId) {
          console.warn('[CartaOferta] No se pudo extraer el Id de la respuesta de create(). Respuesta completa:', res);
          this.ofertasSvc.getByParticipacion(this.participacion()!.Id).subscribe({
            next: ofertas => {
              const ultima = ofertas[0]; // ya viene ordenada por Id descendente
              if (ultima) {
                this.guardarKpisYFinalizar(ultima.Id, v);
              } else {
                this.notif.advertencia('La oferta se creó pero no se pudo confirmar su Id para guardar los KPI. Verifica en SharePoint.');
                this.guardando.set(false);
                this.volver();
              }
            },
            error: () => {
              this.notif.advertencia('La oferta se creó pero no se pudieron guardar los KPI. Verifica en SharePoint.');
              this.guardando.set(false);
              this.volver();
            },
          });
          return;
        }

        this.guardarKpisYFinalizar(ofertaId, v);
      },
      error: () => {
        this.notif.error('Error al crear la carta oferta');
        this.guardando.set(false);
      },
    });
  }

  private guardarKpisYFinalizar(ofertaId: number, v: any) {
    if (v.aplicaKPI && this.periodosArray.length > 0) {
      const kpis = this.periodosArray.controls.map((ctrl, i) => ({
        Periodo:               i + 1,
        UnidadPeriodo:         ctrl.get('unidad')!.value as UnidadPeriodoKPI,
        PorcentajeGarantizado: ctrl.get('porcentaje')!.value!,
        ValorKPI:              v.valorKPI!,
      }));

      this.kpiSvc.reemplazar(ofertaId, kpis).subscribe({
        next: () => this.onGuardadoExitoso(),
        error: (err) => {
          console.error('[CartaOferta] Error guardando KPIs:', err);
          this.notif.advertencia('Carta oferta creada, pero hubo un error al guardar los KPIs. Verifica en SharePoint.');
          this.guardando.set(false);
          this.volver();
        },
      });
    } else {
      this.onGuardadoExitoso();
    }
  }

  private onGuardadoExitoso() {
    this.notif.exito('Carta oferta creada. Power Automate iniciará el proceso de aprobación.');
    this.guardando.set(false);
    this.router.navigate(['/analista/candidatos', this.participacion()!.CandidatoId, 'procesos']);
  }

  volver() {
    this.router.navigate(['/analista/candidatos', this.participacion()?.CandidatoId, 'procesos']);
  }
}