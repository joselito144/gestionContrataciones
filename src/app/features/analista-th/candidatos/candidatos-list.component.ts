import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import { CandidatoItem } from '../../../shared/models';
import { SP_LISTS } from '../../../core/services/sp-lists.constants';

@Component({
  selector: 'app-candidatos-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Candidatos</h2>
          <p class="subtitle">{{ candidatosFiltrados().length }} candidatos registrados</p>
        </div>
        <button mat-flat-button color="primary" (click)="nuevo()">
          <mat-icon>person_add</mat-icon> Nuevo candidato
        </button>
      </div>

      <!-- Filtros -->
      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por nombre</mat-label>
          <input matInput [formControl]="ctrlNombre" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por cédula</mat-label>
          <input matInput [formControl]="ctrlCedula" />
          <mat-icon matSuffix>badge</mat-icon>
        </mat-form-field>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="table-wrap">
          <table mat-table [dataSource]="candidatosFiltrados()" class="data-table">

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Candidato</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-nombre">
                  <div class="avatar-sm">{{ iniciales(c.Nombre_Completo) }}</div>
                  <div>
                    <div class="nombre">{{ c.Nombre_Completo }}</div>
                    <div class="correo">{{ c.Correo }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="identificacion">
              <th mat-header-cell *matHeaderCellDef>Identificación</th>
              <td mat-cell *matCellDef="let c">
                <span class="badge badge--purple">{{ c.TipoIdentificacion }}</span>
                {{ c.NumeroIdentificacion }}
              </td>
            </ng-container>

            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let c" class="text-muted">{{ c.Telefono }}</td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <div class="acciones-row">
                  <!-- Bug fix: stopPropagation en todos los botones para evitar
                       que el clic suba a la fila y dispare editar() -->
                  <button mat-icon-button color="primary"
                    matTooltip="Editar candidato"
                    (click)="editar(c); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="accent"
                    matTooltip="Ver procesos en los que participa"
                    (click)="verProcesos(c); $event.stopPropagation()">
                    <mat-icon>work_history</mat-icon>
                  </button>
                  <button mat-icon-button
                    matTooltip="Ver documentos adjuntos (CV, certificados)"
                    (click)="verDocumentos(c); $event.stopPropagation()">
                    <mat-icon>folder_open</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
            <!-- La fila completa también llama a editar — los botones detienen el bubbling -->
            <tr mat-row *matRowDef="let row; columns: columnas;"
              class="clickable-row"
              (click)="editar(row)">
            </tr>

          </table>

          @if (candidatosFiltrados().length === 0) {
            <div class="empty-state">
              <mat-icon>people_outline</mat-icon>
              <p>No hay candidatos que coincidan con los filtros</p>
              <button mat-flat-button color="primary" (click)="nuevo()">
                Registrar el primero
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filtros-bar   { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field  { flex: 1; min-width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .table-wrap { border: 0.5px solid #D0D8E4; border-radius: 12px; overflow: hidden; }
    .data-table { width: 100%; }
    .cell-nombre { display: flex; align-items: center; gap: 10px; }
    .avatar-sm {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .nombre  { font-size: 13px; font-weight: 500; color: #1E3A5F; }
    .correo  { font-size: 11px; color: #9BA8B5; }
    .text-muted { color: #9BA8B5; font-size: 13px; }
    .acciones-row { display: flex; align-items: center; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #F4F6F9; }
    .empty-state {
      text-align: center; padding: 48px; color: #9BA8B5;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class CandidatosListComponent implements OnInit {
  private svc    = inject(CandidatosService);
  private notif  = inject(NotificacionService);
  private router = inject(Router);
  private viewer = inject(DocumentViewerService);

  candidatos = signal<CandidatoItem[]>([]);
  cargando   = signal(true);
  columnas   = ['nombre', 'identificacion', 'telefono', 'acciones'];

  ctrlNombre = new FormControl('');
  ctrlCedula = new FormControl('');

  private nombreSignal = toSignal(this.ctrlNombre.valueChanges, { initialValue: '' });
  private cedulaSignal = toSignal(this.ctrlCedula.valueChanges, { initialValue: '' });

  candidatosFiltrados = computed(() => {
    const nombre = (this.nombreSignal() ?? '').toLowerCase();
    const cedula = (this.cedulaSignal() ?? '').toLowerCase();
    return this.candidatos().filter(c => {
      const mN = !nombre || c.Nombre_Completo.toLowerCase().includes(nombre);
      const mC = !cedula || c.NumeroIdentificacion?.toLowerCase().includes(cedula);
      return mN && mC;
    });
  });

  ngOnInit() {
    this.svc.getAll().subscribe({
      next:  c => { this.candidatos.set(c); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar candidatos'); this.cargando.set(false); },
    });
  }

  nuevo()                       { this.router.navigate(['/analista/candidatos/nuevo']); }
  editar(c: CandidatoItem)      { this.router.navigate(['/analista/candidatos', c.Id]); }
  verProcesos(c: CandidatoItem) { this.router.navigate(['/analista/candidatos', c.Id, 'procesos']); }
  verDocumentos(c: CandidatoItem) {
    this.viewer.abrir(c.Nombre_Completo, SP_LISTS.CANDIDATOS, c.Id);
  }

  iniciales(n: string): string {
    const p = (n ?? '').trim().split(' ');
    return p.length >= 2
      ? (p[0][0] + p[1][0]).toUpperCase()
      : (n ?? '??').substring(0, 2).toUpperCase();
  }
}