import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { PerfilesCargosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PerfilCargoItem } from '../../../shared/models';

@Component({
  selector: 'app-perfiles-cargos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatTooltipModule, MatExpansionModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Perfiles y cargos</h2>
          <p class="subtitle">Catálogo de cargos con requisitos y competencias</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nuevo perfil
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-accordion>
          @for (p of perfiles(); track p.Id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ p.Cargo }}</mat-panel-title>
                <mat-panel-description>
                  Experiencia mínima: {{ p.ExperienciaMinima }} año(s)
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="perfil-detail">
                <div class="perfil-section">
                  <h4>Competencias requeridas</h4>
                  <p>{{ p.ComptenciasRequeridas }}</p>
                </div>
                <div class="perfil-section">
                  <h4>Formación y conocimiento</h4>
                  <p>{{ p.FormacionConocimiento }}</p>
                </div>
                <div class="perfil-actions">
                  <button mat-stroked-button color="primary" (click)="abrirFormulario(p)">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                  <button mat-stroked-button color="warn" (click)="eliminar(p)">
                    <mat-icon>delete</mat-icon> Eliminar
                  </button>
                </div>
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        @if (perfiles().length === 0) {
          <div class="empty-state">
            <mat-icon>work_outline</mat-icon>
            <p>No hay perfiles definidos aún</p>
          </div>
        }

        @if (mostrarForm()) {
          <div class="form-overlay" (click)="cerrarFormulario()">
            <div class="form-panel" (click)="$event.stopPropagation()">
              <h3>{{ editando() ? 'Editar perfil' : 'Nuevo perfil' }}</h3>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <div class="field-grid cols-1">
                  <mat-form-field appearance="outline">
                    <mat-label>Nombre del cargo *</mat-label>
                    <input matInput formControlName="cargo" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Experiencia mínima (años) *</mat-label>
                    <input matInput type="number" formControlName="experiencia" min="0" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Competencias requeridas</mat-label>
                    <textarea matInput formControlName="competencias" rows="3"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Formación y conocimiento</mat-label>
                    <textarea matInput formControlName="formacion" rows="3"></textarea>
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
    .perfil-detail  { padding: 8px 0; }
    .perfil-section { margin-bottom: 16px; }
    .perfil-section h4 { font-size: 12px; font-weight: 500; color: #5F6B7A; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 6px; }
    .perfil-section p  { font-size: 13px; color: #1E2A38; margin: 0; white-space: pre-wrap; }
    .perfil-actions { display: flex; gap: 8px; padding-top: 8px; }
    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .form-panel { background: #fff; border-radius: 12px; padding: 24px; width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
    .form-panel h3 { margin: 0 0 20px; color: #1E3A5F; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class PerfilesCargosComponent implements OnInit {
  private svc   = inject(PerfilesCargosService);
  private notif = inject(NotificacionService);
  private fb    = inject(FormBuilder);

  perfiles    = signal<PerfilCargoItem[]>([]);
  cargando    = signal(true);
  guardando   = signal(false);
  mostrarForm = signal(false);
  editando    = signal<PerfilCargoItem | null>(null);

  form = this.fb.group({
    cargo:       ['', Validators.required],
    experiencia: [0, [Validators.required, Validators.min(0)]],
    competencias: [''],
    formacion:   [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getAll().subscribe({
      next:  p => { this.perfiles.set(p); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar perfiles'); this.cargando.set(false); },
    });
  }

  abrirFormulario(p?: PerfilCargoItem) {
    this.editando.set(p ?? null);
    this.form.reset({
      cargo:        p?.Cargo ?? '',
      experiencia:  p?.ExperienciaMinima ?? 0,
      competencias: p?.ComptenciasRequeridas ?? '',
      formacion:    p?.FormacionConocimiento ?? '',
    });
    this.mostrarForm.set(true);
  }

  cerrarFormulario() { this.mostrarForm.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const { cargo, experiencia, competencias, formacion } = this.form.value;
    const p   = this.editando();
    const data = { Cargo: cargo!, ExperienciaMinima: experiencia!, ComptenciasRequeridas: competencias ?? '', FormacionConocimiento: formacion ?? '' };
    const obs = p ? this.svc.update(p.Id, data) : this.svc.create(data);

    obs.subscribe({
      next: () => { this.notif.exito('Perfil guardado'); this.guardando.set(false); this.cerrarFormulario(); this.cargar(); },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  eliminar(p: PerfilCargoItem) {
    if (!confirm(`¿Eliminar el perfil "${p.Cargo}"?`)) return;
    this.svc.delete(p.Id).subscribe({
      next:  () => { this.notif.exito('Perfil eliminado'); this.cargar(); },
      error: () => this.notif.error('Error al eliminar'),
    });
  }
}
