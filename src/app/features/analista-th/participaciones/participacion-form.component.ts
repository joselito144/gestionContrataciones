import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  CandidatosService,
  SolicitudesService,
  ParticipacionesService,
} from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { CandidatoItem, SolicitudItem } from '../../../shared/models';

@Component({
  selector: 'app-participacion-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button mat-icon-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2>Vincular candidato a solicitud</h2>
            <p class="subtitle">Registra la participación de un candidato en un proceso</p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- Candidato -->
          <div class="card">
            <p class="section-title">Candidato</p>

            @if (candidatoFijo()) {
              <!-- Viene desde el perfil del candidato — campo solo lectura -->
              <div class="candidato-chip">
                <div class="avatar-sm">{{ iniciales(candidatoFijo()!.Nombre_Completo) }}</div>
                <div>
                  <div class="chip-nombre">{{ candidatoFijo()!.Nombre_Completo }}</div>
                  <div class="chip-id">
                    {{ candidatoFijo()!.TipoIdentificacion }} {{ candidatoFijo()!.NumeroIdentificacion }}
                  </div>
                </div>
                <mat-icon class="chip-lock" matTooltip="Candidato preseleccionado">lock</mat-icon>
              </div>
            } @else {
              <!-- Autocomplete libre -->
              <mat-form-field appearance="outline">
                <mat-label>Buscar candidato *</mat-label>
                <input matInput formControlName="candidatoBusqueda"
                  [matAutocomplete]="autoCandidato"
                  placeholder="Nombre o número de identificación..." />
                <mat-autocomplete #autoCandidato="matAutocomplete"
                  [displayWith]="displayCandidato"
                  (optionSelected)="onCandidatoSelected($event.option.value)">
                  @for (c of candidatosFiltrados(); track c.Id) {
                    <mat-option [value]="c">
                      <span class="opt-nombre">{{ c.Nombre_Completo }}</span>
                      <span class="opt-id"> · {{ c.TipoIdentificacion }} {{ c.NumeroIdentificacion }}</span>
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            }
          </div>

          <!-- Solicitud -->
          <div class="card">
            <p class="section-title">Solicitud aprobada</p>
            <mat-form-field appearance="outline">
              <mat-label>Solicitud *</mat-label>
              <mat-select formControlName="solicitudId">
                @for (s of solicitudes(); track s.Id) {
                  <mat-option [value]="s.Id">
                    SOL-{{ s.Id }} · {{ s.Pefil_solicitado?.Cargo }} — {{ s.AreaSolicitante?.Title }}
                  </mat-option>
                }
              </mat-select>
              <mat-hint>Solo se muestran solicitudes con estado Aprobado</mat-hint>
              @if (form.get('solicitudId')?.hasError('required') && form.get('solicitudId')?.touched) {
                <mat-error>Selecciona una solicitud</mat-error>
              }
            </mat-form-field>

            <!-- Advertencia si ya existe la participación -->
            @if (participacionDuplicada()) {
              <div class="alerta-duplicado">
                <mat-icon>warning</mat-icon>
                Este candidato ya está vinculado a esta solicitud.
              </div>
            }
          </div>

          <!-- Notas iniciales -->
          <div class="card">
            <p class="section-title">Notas del proceso (opcional)</p>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Observaciones iniciales</mat-label>
              <textarea matInput formControlName="notas" rows="3"
                placeholder="Comentarios específicos de esta participación...">
              </textarea>
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || guardando() || participacionDuplicada()">
              @if (guardando()) { <mat-spinner diameter="18" /> }
              @else { <mat-icon>link</mat-icon> Vincular candidato }
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .candidato-chip {
      display: flex; align-items: center; gap: 10px;
      background: #E6F1FB; border-radius: 8px; padding: 10px 14px;
    }
    .avatar-sm {
      width: 36px; height: 36px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .chip-nombre { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .chip-id     { font-size: 11px; color: #185FA5; }
    .chip-lock   { color: #B5D4F4; font-size: 18px; margin-left: auto; }
    .opt-nombre  { font-weight: 500; }
    .opt-id      { color: #9BA8B5; font-size: 12px; }
    .alerta-duplicado {
      display: flex; align-items: center; gap: 8px;
      margin-top: 8px; padding: 8px 12px;
      background: #FAEEDA; border-radius: 6px;
      font-size: 13px; color: #854F0B;
    }
    .alerta-duplicado mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class ParticipacionFormComponent implements OnInit {
  private candidatosSvc    = inject(CandidatosService);
  private solicitudesSvc   = inject(SolicitudesService);
  private participacionSvc = inject(ParticipacionesService);
  private notif            = inject(NotificacionService);
  private router           = inject(Router);
  private route            = inject(ActivatedRoute);
  private fb               = inject(FormBuilder);

  cargando    = signal(true);
  guardando   = signal(false);
  candidatos  = signal<CandidatoItem[]>([]);
  solicitudes = signal<SolicitudItem[]>([]);
  candidatoFijo = signal<CandidatoItem | null>(null);
  participacionDuplicada = signal(false);

  candidatosFiltrados = computed(() => {
    const t = (this.form?.get('candidatoBusqueda')?.value ?? '').toLowerCase();
    if (!t || typeof t !== 'string') return this.candidatos();
    return this.candidatos().filter(c =>
      c.Nombre_Completo.toLowerCase().includes(t) ||
      c.NumeroIdentificacion?.toLowerCase().includes(t)
    );
  });

  form = this.fb.group({
    candidatoBusqueda: [''],
    candidatoId:       [null as number | null, Validators.required],
    solicitudId:       [null as number | null, Validators.required],
    notas:             [''],
  });

  ngOnInit() {
    const candidatoIdParam = this.route.snapshot.queryParamMap.get('candidatoId');

    forkJoin({
      candidatos:  this.candidatosSvc.getAll(),
      solicitudes: this.solicitudesSvc.getAprobadas(),
    }).subscribe({
      next: ({ candidatos, solicitudes }) => {
        this.candidatos.set(candidatos);
        this.solicitudes.set(solicitudes);

        // Si viene con candidato preseleccionado
        if (candidatoIdParam) {
          const c = candidatos.find(x => x.Id === +candidatoIdParam);
          if (c) {
            this.candidatoFijo.set(c);
            this.form.patchValue({ candidatoId: c.Id });
          }
        }

        this.cargando.set(false);
      },
      error: () => { this.notif.error('Error al cargar datos'); this.cargando.set(false); },
    });

    // Verifica duplicados cuando cambian candidato o solicitud
    this.form.get('solicitudId')?.valueChanges.subscribe(() => this.verificarDuplicado());
    this.form.get('candidatoId')?.valueChanges.subscribe(() => this.verificarDuplicado());
  }

  verificarDuplicado() {
    const cId = this.form.get('candidatoId')?.value;
    const sId = this.form.get('solicitudId')?.value;
    if (!cId || !sId) { this.participacionDuplicada.set(false); return; }
    this.participacionSvc.existeParticipacion(cId, sId).subscribe(resultado => {
      this.participacionDuplicada.set(resultado.length > 0);
    });
  }

  onCandidatoSelected(c: CandidatoItem) {
    this.form.patchValue({ candidatoId: c.Id });
  }

  displayCandidato(c: CandidatoItem | string): string {
    if (!c) return '';
    return typeof c === 'string' ? c : `${c.Nombre_Completo} · ${c.NumeroIdentificacion}`;
  }

  guardar() {
    if (this.form.invalid || this.participacionDuplicada()) return;
    this.guardando.set(true);

    this.participacionSvc.create({
      CandidatoId: this.form.value.candidatoId!,
      SolicitudId: this.form.value.solicitudId!,
      Estado:      'En proceso',
      Examenes_OK: false,
      Notas_Proceso: this.form.value.notas ?? '',
    }).subscribe({
      next: () => {
        this.notif.exito('Candidato vinculado al proceso correctamente');
        this.guardando.set(false);
        // Vuelve al perfil del candidato si vino desde ahí
        const cId = this.form.value.candidatoId;
        if (this.candidatoFijo()) {
          this.router.navigate(['/analista/candidatos', cId, 'procesos']);
        } else {
          this.router.navigate(['/analista/solicitudes']);
        }
      },
      error: () => { this.notif.error('Error al vincular candidato'); this.guardando.set(false); },
    });
  }

  iniciales(n: string): string {
    const p = n.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  }

  volver() {
    const cId = this.candidatoFijo()?.Id;
    if (cId) this.router.navigate(['/analista/candidatos', cId, 'procesos']);
    else this.router.navigate(['/analista/candidatos']);
  }
}