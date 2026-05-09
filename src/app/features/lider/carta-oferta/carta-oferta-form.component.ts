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
import { SolicitudesService, CandidatosService, OfertasService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { CandidatoItem, SolicitudItem } from '../../../shared/models';

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
          <button mat-icon-button (click)="volver()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h2>Nueva carta oferta</h2>
            <p class="subtitle">{{ solicitud()?.Perfil_Solicitado }}</p>
          </div>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <!-- Candidato -->
          <div class="card">
            <p class="section-title">Candidato seleccionado</p>
            <mat-form-field appearance="outline">
              <mat-label>Candidato *</mat-label>
              <mat-select formControlName="candidatoId">
                @for (c of candidatos(); track c.Id) {
                  <mat-option [value]="c.Id">{{ c.Nombre_Completo }} · {{ c.Correo }}</mat-option>
                }
              </mat-select>
              <mat-hint>Solo candidatos con estado "Seleccionado"</mat-hint>
            </mat-form-field>
          </div>

          <!-- Condiciones de la oferta -->
          <div class="card">
            <p class="section-title">Condiciones ofertadas</p>
            <div class="field-grid">
              <mat-form-field appearance="outline">
                <mat-label>Cargo ofertado *</mat-label>
                <input matInput formControlName="cargo" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Salario mensual (COP) *</mat-label>
                <input matInput type="number" formControlName="salario" min="0" />
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio *</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="fechaInicio" />
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tipo de contrato</mat-label>
                <mat-select formControlName="tipoContrato">
                  <mat-option value="Término indefinido">Término indefinido</mat-option>
                  <mat-option value="Término fijo">Término fijo</mat-option>
                  <mat-option value="Por obra o labor">Por obra o labor</mat-option>
                  <mat-option value="Prestación de servicios">Prestación de servicios</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Acciones del flujo -->
          <div class="card info-card">
            <mat-icon>info</mat-icon>
            <div>
              <p><strong>Al guardar esta carta oferta:</strong></p>
              <ul>
                <li>Se creará el registro en la lista Ofertas de SharePoint</li>
                <li>Power Automate generará el PDF desde la plantilla Word</li>
                <li>La oferta pasará a aprobación del Director Administrativo</li>
                <li>Una vez aprobada, se enviará automáticamente al aspirante</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="volver()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
              @if (guardando()) { <mat-spinner diameter="18" /> } @else { Generar carta oferta }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .info-card { display: flex; gap: 12px; background: #E6F1FB; border-color: #B5D4F4; }
    .info-card mat-icon { color: #185FA5; flex-shrink: 0; margin-top: 2px; }
    .info-card p  { margin: 0 0 8px; font-size: 13px; color: #1E3A5F; }
    .info-card ul { margin: 0; padding-left: 20px; font-size: 12px; color: #5F6B7A; }
    .info-card li { margin-bottom: 4px; }
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

  cargando    = signal(true);
  guardando   = signal(false);
  solicitud   = signal<SolicitudItem | null>(null);
  candidatos  = signal<CandidatoItem[]>([]);

  form = this.fb.group({
    candidatoId:   [null as number | null, Validators.required],
    cargo:         ['', Validators.required],
    salario:       [null as number | null, [Validators.required, Validators.min(1)]],
    fechaInicio:   [null, Validators.required],
    tipoContrato:  ['Término indefinido'],
  });

  ngOnInit() {
    const solicitudId = +this.route.snapshot.paramMap.get('id')!;
    this.solicitudesSvc.getById(solicitudId).subscribe(s => {
      this.solicitud.set(s);
      this.form.patchValue({ cargo: s.Perfil_Solicitado });
    });
    this.candidatosSvc.getSeleccionados(solicitudId).subscribe(c => {
      this.candidatos.set(c);
      this.cargando.set(false);
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;

    this.ofertasSvc.create({
      ID_CandidatoId: v.candidatoId!,
      Salario_Ofertado: v.salario!,
      Cargo: v.cargo!,
      Estado_Oferta: 'Enviada',
      Aprobada_DirAdm: false,
    }).subscribe({
      next: () => {
        this.notif.exito('Carta oferta creada. Power Automate iniciará el proceso de aprobación.');
        this.guardando.set(false);
        this.router.navigate(['/lider/solicitudes']);
      },
      error: () => { this.notif.error('Error al crear la carta oferta'); this.guardando.set(false); },
    });
  }

  volver() { this.router.navigate(['/lider/solicitudes']); }
}
