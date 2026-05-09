import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { AprobadoresService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AprobadorItem, CargoAprobador } from '../../../shared/models';

@Component({
  selector: 'app-aprobadores',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Aprobadores del flujo</h2>
          <p class="subtitle">Define quiénes aprueban las solicitudes y en qué orden</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nuevo aprobador
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="card">
          <table mat-table [dataSource]="aprobadores()" class="data-table">
            <ng-container matColumnDef="orden">
              <th mat-header-cell *matHeaderCellDef>Orden</th>
              <td mat-cell *matCellDef="let a">
                <div class="orden-badge">{{ a.Orden }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="cargo">
              <th mat-header-cell *matHeaderCellDef>Cargo</th>
              <td mat-cell *matCellDef="let a">
                <span class="badge badge--primary">{{ a.Cargo }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="persona">
              <th mat-header-cell *matHeaderCellDef>Persona asignada</th>
              <td mat-cell *matCellDef="let a">
                <div class="user-cell">
                  <div class="avatar-sm">{{ iniciales(a.Persona.Title) }}</div>
                  <div>
                    <div class="user-name">{{ a.Persona.Title }}</div>
                    <div class="user-email">{{ a.Persona.EMail }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Activo</th>
              <td mat-cell *matCellDef="let a">
                <mat-slide-toggle [checked]="a.Activo" (change)="toggleActivo(a, $event.checked)" color="primary" />
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a">
                <button mat-icon-button color="primary" matTooltip="Editar" (click)="abrirFormulario(a)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="eliminar(a)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas"></tr>
            <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
          </table>
        </div>

        @if (mostrarForm()) {
          <div class="form-overlay" (click)="cerrarFormulario()">
            <div class="form-panel" (click)="$event.stopPropagation()">
              <h3>{{ editando() ? 'Editar aprobador' : 'Nuevo aprobador' }}</h3>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <div class="field-grid cols-1">
                  <mat-form-field>
                    <mat-label>Cargo</mat-label>
                    <mat-select formControlName="cargo">
                      @for (c of cargos; track c) {
                        <mat-option [value]="c">{{ c }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Email del aprobador</mat-label>
                    <input matInput formControlName="email" placeholder="aprobador@empresa.com" />
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Orden</mat-label>
                    <input matInput type="number" formControlName="orden" min="1" />
                    <mat-hint>Número que define el orden de aprobación (1 = primero)</mat-hint>
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button mat-button type="button" (click)="cerrarFormulario()">Cancelar</button>
                  <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
                    @if (guardando()) { <mat-spinner diameter="18" /> } @else { Guardar }
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .orden-badge { width: 28px; height: 28px; border-radius: 50%; background: #1E3A5F; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #378ADD; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-weight: 500; flex-shrink: 0; }
    .user-name  { font-size: 13px; font-weight: 500; }
    .user-email { font-size: 11px; color: #9BA8B5; }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .form-panel { background: #fff; border-radius: 12px; padding: 24px; width: 440px; max-width: 95vw; }
    .form-panel h3 { margin: 0 0 20px; color: #1E3A5F; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class AprobadoresComponent implements OnInit {
  private svc   = inject(AprobadoresService);
  private notif = inject(NotificacionService);
  private fb    = inject(FormBuilder);

  aprobadores = signal<AprobadorItem[]>([]);
  cargando    = signal(true);
  guardando   = signal(false);
  mostrarForm = signal(false);
  editando    = signal<AprobadorItem | null>(null);

  columnas = ['orden', 'cargo', 'persona', 'activo', 'acciones'];
  cargos: CargoAprobador[] = ['Líder del Proceso', 'Gerente', 'Director Administrativo y Financiero'];

  form = this.fb.group({
    cargo: ['' as CargoAprobador, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    orden: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getAll().subscribe({
      next:  a => { this.aprobadores.set(a); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar aprobadores'); this.cargando.set(false); },
    });
  }

  abrirFormulario(a?: AprobadorItem) {
    this.editando.set(a ?? null);
    this.form.reset({ cargo: a?.Cargo ?? '' as any, email: a?.Persona.EMail ?? '', orden: a?.Orden ?? 1 });
    this.mostrarForm.set(true);
  }

  cerrarFormulario() { this.mostrarForm.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const { cargo, orden } = this.form.value;
    const a = this.editando();
    const obs = a
      ? this.svc.update(a.Id, { Cargo: cargo!, Orden: orden! })
      : this.svc.create({ Cargo: cargo!, PersonaId: 0, Orden: orden!, Activo: true });

    obs.subscribe({
      next: () => { this.notif.exito('Guardado correctamente'); this.guardando.set(false); this.cerrarFormulario(); this.cargar(); },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  eliminar(a: AprobadorItem) {
    if (!confirm(`¿Eliminar aprobador ${a.Persona.Title}?`)) return;
    this.svc.delete(a.Id).subscribe({
      next:  () => { this.notif.exito('Aprobador eliminado'); this.cargar(); },
      error: () => this.notif.error('Error al eliminar'),
    });
  }

  toggleActivo(a: AprobadorItem, activo: boolean) {
    this.svc.toggleActivo(a.Id, activo).subscribe({
      next:  () => this.notif.exito(`Aprobador ${activo ? 'activado' : 'desactivado'}`),
      error: () => this.notif.error('Error al actualizar'),
    });
  }

  iniciales(nombre: string): string {
    const p = nombre.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
  }
}
