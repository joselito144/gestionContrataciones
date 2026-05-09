import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { RolesAppService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { RolAppItem, RolApp } from '../../../shared/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Usuarios y roles</h2>
          <p class="subtitle">Gestión de acceso a la aplicación</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nuevo usuario
        </button>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="card">
          <table mat-table [dataSource]="usuarios()" class="data-table">
            <ng-container matColumnDef="usuario">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <div class="avatar-sm">{{ iniciales(u.Usuario.Title) }}</div>
                  <div>
                    <div class="user-name">{{ u.Usuario.Title }}</div>
                    <div class="user-email">{{ u.Usuario.EMail }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Rol</th>
              <td mat-cell *matCellDef="let u">
                <span [class]="'badge badge--' + badgeRol(u.Rol)">{{ u.Rol }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Activo</th>
              <td mat-cell *matCellDef="let u">
                <mat-slide-toggle
                  [checked]="u.Activo"
                  (change)="toggleActivo(u, $event.checked)"
                  color="primary" />
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button color="primary" matTooltip="Editar" (click)="abrirFormulario(u)">
                  <mat-icon>edit</mat-icon>
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
              <h3>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <div class="field-grid cols-1">
                  <mat-form-field>
                    <mat-label>Email corporativo</mat-label>
                    <input matInput formControlName="email" placeholder="usuario@empresa.com" />
                    <mat-hint>Debe coincidir exactamente con el email en Azure AD</mat-hint>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Rol</mat-label>
                    <mat-select formControlName="rol">
                      @for (r of roles; track r) {
                        <mat-option [value]="r">{{ r }}</mat-option>
                      }
                    </mat-select>
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
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #1E3A5F; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-weight: 500; flex-shrink: 0; }
    .user-name  { font-size: 13px; font-weight: 500; }
    .user-email { font-size: 11px; color: #9BA8B5; }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .form-panel { background: #fff; border-radius: 12px; padding: 24px; width: 420px; max-width: 95vw; }
    .form-panel h3 { margin: 0 0 20px; color: #1E3A5F; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class UsuariosComponent implements OnInit {
  private svc  = inject(RolesAppService);
  private notif = inject(NotificacionService);
  private fb   = inject(FormBuilder);

  usuarios  = signal<RolAppItem[]>([]);
  cargando  = signal(true);
  guardando = signal(false);
  mostrarForm = signal(false);
  editando  = signal<RolAppItem | null>(null);

  columnas = ['usuario', 'rol', 'activo', 'acciones'];
  roles: RolApp[] = ['AnalistaTH', 'LiderArea', 'Administrador'];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    rol:   ['' as RolApp, Validators.required],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getAll().subscribe({
      next:  u => { this.usuarios.set(u); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar usuarios'); this.cargando.set(false); },
    });
  }

  abrirFormulario(u?: RolAppItem) {
    this.editando.set(u ?? null);
    this.form.reset({ email: u?.Usuario.EMail ?? '', rol: u?.Rol ?? '' as any });
    this.mostrarForm.set(true);
  }

  cerrarFormulario() { this.mostrarForm.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const { email, rol } = this.form.value;
    const u = this.editando();

    const obs = u
      ? this.svc.cambiarRol(u.Id, rol!)
      : this.svc.create({ UsuarioId: 0, Rol: rol!, Activo: true });

    obs.subscribe({
      next: () => {
        this.notif.exito(u ? 'Usuario actualizado' : 'Usuario creado');
        this.guardando.set(false);
        this.cerrarFormulario();
        this.cargar();
      },
      error: () => { this.notif.error('Error al guardar'); this.guardando.set(false); },
    });
  }

  toggleActivo(u: RolAppItem, activo: boolean) {
    this.svc.toggleActivo(u.Id, activo).subscribe({
      next:  () => this.notif.exito(`Usuario ${activo ? 'activado' : 'desactivado'}`),
      error: () => this.notif.error('Error al actualizar'),
    });
  }

  iniciales(nombre: string): string {
    const p = nombre.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
  }

  badgeRol(rol: RolApp): string {
    return { AnalistaTH: 'primary', LiderArea: 'success', Administrador: 'purple' }[rol] ?? 'neutral';
  }
}
