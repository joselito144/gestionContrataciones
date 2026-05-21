import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DocumentViewerService } from '../../../shared/components/document-viewer/document-viewer.service';
import { CandidatoItem } from '../../../shared/models';

@Component({
  selector: 'app-candidatos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Candidatos</h2>
          <p class="subtitle">Catálogo de candidatos registrados</p>
        </div>
        <button mat-flat-button color="primary" (click)="nuevo()">
          <mat-icon>person_add</mat-icon> Nuevo candidato
        </button>
      </div>

      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por nombre o identificación</mat-label>
          <input matInput [(ngModel)]="textoBusqueda" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <p class="results-info">{{ candidatosFiltrados().length }} candidatos</p>

        <div class="candidatos-grid">
          @for (c of candidatosFiltrados(); track c.Id) {
            <div class="candidato-card card">
              <div class="cand-header">
                <div class="avatar">{{ iniciales(c.Nombre_Completo) }}</div>
                <div class="cand-info">
                  <div class="cand-nombre">{{ c.Nombre_Completo }}</div>
                  <div class="cand-id">
                    {{ c.TipoIdentificacion }} {{ c.NumeroIdentificacion }}
                  </div>
                  <div class="cand-correo">{{ c.Correo }}</div>
                  <div class="cand-tel">{{ c.Telefono }}</div>
                </div>
              </div>

              @if (c.Direccion) {
                <div class="cand-direccion">
                  <mat-icon>place</mat-icon> {{ c.Direccion }}
                </div>
              }

              <div class="cand-footer">
                <button mat-stroked-button (click)="editar(c)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
                <button mat-stroked-button color="accent"
                  (click)="verProcesos(c)"
                  matTooltip="Ver procesos en los que participa">
                  <mat-icon>work_history</mat-icon> Procesos
                </button>
                <button mat-icon-button color="primary"
                  matTooltip="Ver documentos adjuntos"
                  (click)="verDocumentos(c)">
                  <mat-icon>folder_open</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        @if (candidatosFiltrados().length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>No hay candidatos registrados aún</p>
            <button mat-flat-button color="primary" (click)="nuevo()">
              Registrar el primero
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filtros-bar  { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .results-info { font-size: 12px; color: #9BA8B5; margin-bottom: 8px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .candidatos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .candidato-card { display: flex; flex-direction: column; gap: 10px; }
    .cand-header  { display: flex; align-items: flex-start; gap: 12px; }
    .avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: #1E3A5F; display: flex; align-items: center;
      justify-content: center; font-size: 15px; font-weight: 500;
      color: #fff; flex-shrink: 0;
    }
    .cand-info    { flex: 1; min-width: 0; }
    .cand-nombre  { font-size: 14px; font-weight: 500; color: #1E3A5F; }
    .cand-id      { font-size: 12px; color: #534AB7; font-weight: 500; margin-top: 1px; }
    .cand-correo  { font-size: 12px; color: #9BA8B5; }
    .cand-tel     { font-size: 12px; color: #9BA8B5; }
    .cand-direccion {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #9BA8B5;
    }
    .cand-direccion mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .cand-footer {
      display: flex; align-items: center; gap: 6px;
      padding-top: 8px; border-top: 0.5px solid #EEF1F5;
      flex-wrap: wrap;
    }
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

  candidatos   = signal<CandidatoItem[]>([]);
  cargando     = signal(true);
  textoBusqueda = '';

  candidatosFiltrados = computed(() => {
    const t = this.textoBusqueda.toLowerCase();
    if (!t) return this.candidatos();
    return this.candidatos().filter(c =>
      c.Nombre_Completo.toLowerCase().includes(t) ||
      c.NumeroIdentificacion?.toLowerCase().includes(t) ||
      c.Correo?.toLowerCase().includes(t)
    );
  });

  ngOnInit() {
    this.svc.getAll().subscribe({
      next:  c => { this.candidatos.set(c); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar candidatos'); this.cargando.set(false); },
    });
  }

  nuevo()                    { this.router.navigate(['/analista/candidatos/nuevo']); }
  editar(c: CandidatoItem)   { this.router.navigate(['/analista/candidatos', c.Id]); }
  verProcesos(c: CandidatoItem) { this.router.navigate(['/analista/candidatos', c.Id, 'procesos']); }
  verDocumentos(c: CandidatoItem) {
    this.viewer.abrir(c.Nombre_Completo, 'Candidatos', c.Id);
  }

  iniciales(n: string): string {
    const p = n.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  }
}