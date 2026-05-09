import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AreasService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AreaItem } from '../../../shared/models';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Áreas de la empresa</h2>
          <p class="subtitle">Catálogo de áreas disponibles para las solicitudes</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nueva área
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="card">
          <table mat-table [dataSource]="areas()" class="data-table">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let a"><strong>{{ a.Title }}</strong></td>
            </ng-container>
            <ng-container matColumnDef="descripcion">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let a" class="text-muted">{{ a.Descripcion }}</td>
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
              <h3>{{ editando() ? 'Editar área' : 'Nueva área' }}</h3>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <div class="field-grid cols-1">
                  <mat-form-field>
                    <mat-label>Nombre del área</mat-label>
                    <input matInput formControlName="nombre" />
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Descripción</mat-label>
                    <textarea matInput formControlName="descripcion" rows="3"></textarea>
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
    .text-muted { color: #9BA8B5; font-size: 13px; }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .form-panel { background: #fff; border-radius: 12px; padding: 24px; width: 420px; max-width: 95vw; }
    .form-panel h3 { margin: 0 0 20px; color: #1E3A5F; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class AreasComponent implements OnInit {
  private svc   = inject(AreasService);
  private notif = inject(NotificacionService);
  private fb    = inject(FormBuilder);

  areas       = signal<AreaItem[]>([]);
  cargando    = signal(true);
  guardando   = signal(false);
  mostrarForm = signal(false);
  editando    = signal<AreaItem | null>(null);
  columnas    = ['nombre', 'descripcion', 'acciones'];

  form = this.fb.group({
    nombre:      ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getAll().subscribe({
      next:  a => { this.areas.set(a); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar áreas'); this.cargando.set(false); },
    });
  }

  abrirFormulario(a?: AreaItem) {
    this.editando.set(a ?? null);
    this.form.reset({ nombre: a?.Title ?? '', descripcion: a?.Descripcion ?? '' });
    this.mostrarForm.set(true);
  }

  cerrarFormulario() { this.mostrarForm.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const { nombre, descripcion } = this.form.value;
    const a   = this.editando();
    const obs = a
      ? this.svc.update(a.Id, { Title: nombre!, Descripcion: descripcion ?? '' })
      : this.svc.create({ Title: nombre!, Descripcion: descripcion ?? '' });

    obs.subscribe({
      next: () => { this.notif.exito('Área guardada'); this.guardando.set(false); this.cerrarFormulario(); this.cargar(); },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  eliminar(a: AreaItem) {
    if (!confirm(`¿Eliminar el área "${a.Title}"?`)) return;
    this.svc.delete(a.Id).subscribe({
      next:  () => { this.notif.exito('Área eliminada'); this.cargar(); },
      error: () => this.notif.error('Error al eliminar'),
    });
  }
}
