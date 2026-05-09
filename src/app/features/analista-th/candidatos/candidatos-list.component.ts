import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CandidatosService } from '../../../core/services/domain';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { CandidatoItem, EstadoCandidato } from '../../../shared/models';

@Component({
  selector: 'app-candidatos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Candidatos</h2>
          <p class="subtitle">{{ candidatosFiltrados().length }} candidatos activos</p>
        </div>
        <button mat-flat-button color="primary" (click)="nuevo()">
          <mat-icon>person_add</mat-icon> Nuevo candidato
        </button>
      </div>

      <div class="filtros-bar card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por nombre o correo</mat-label>
          <input matInput [(ngModel)]="textoBusqueda" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filtroEstado">
            <mat-option value="">Todos</mat-option>
            <mat-option value="En proceso">En proceso</mat-option>
            <mat-option value="Seleccionado">Seleccionado</mat-option>
            <mat-option value="Descartado">Descartado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (cargando()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="candidatos-grid">
          @for (c of candidatosFiltrados(); track c.Id) {
            <div class="candidato-card card" (click)="editar(c)">
              <div class="cand-header">
                <div class="avatar">{{ iniciales(c.Nombre_Completo) }}</div>
                <div class="cand-info">
                  <div class="cand-nombre">{{ c.Nombre_Completo }}</div>
                  <div class="cand-correo">{{ c.Correo }}</div>
                  <div class="cand-tel">{{ c.Telefono }}</div>
                </div>
                <span [class]="'badge badge--' + badgeEstado(c.Estado)">{{ c.Estado }}</span>
              </div>

              <div class="cand-meta">
                @if (c.ID_Solicitud) {
                  <span class="badge badge--purple">{{ c.ID_Solicitud.Title }}</span>
                }
                @if (c.Examenes_OK) {
                  <span class="badge badge--success">
                    <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">check_circle</mat-icon>
                    Exámenes OK
                  </span>
                } @else {
                  <span class="badge badge--warning">Exámenes pendientes</span>
                }
              </div>

              <div class="cand-footer">
                <span class="fecha">Ingresó {{ c.Fecha_Ingreso | date:'dd/MM/yyyy' }}</span>
                @if (c.CV_URL) {
                  <a [href]="c.CV_URL.Url" target="_blank" (click)="$event.stopPropagation()" class="cv-link">
                    <mat-icon>description</mat-icon> Ver CV
                  </a>
                }
              </div>
            </div>
          }
        </div>

        @if (candidatosFiltrados().length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>No hay candidatos con los filtros aplicados</p>
            <button mat-flat-button color="primary" (click)="nuevo()">Agregar el primero</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filtros-bar { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .candidatos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .candidato-card { cursor: pointer; transition: border-color .15s; }
    .candidato-card:hover { border-color: #378ADD; }

    .cand-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #1E3A5F; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; color: #fff; flex-shrink: 0; }
    .cand-info { flex: 1; }
    .cand-nombre { font-size: 14px; font-weight: 500; color: #1E3A5F; }
    .cand-correo { font-size: 12px; color: #9BA8B5; }
    .cand-tel    { font-size: 12px; color: #9BA8B5; }

    .cand-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .cand-footer { display: flex; align-items: center; justify-content: space-between; border-top: 0.5px solid #EEF1F5; padding-top: 8px; }
    .fecha { font-size: 11px; color: #9BA8B5; }
    .cv-link { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #185FA5; text-decoration: none; }
    .cv-link mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .empty-state { text-align: center; padding: 48px; color: #9BA8B5; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class CandidatosListComponent implements OnInit {
  private svc    = inject(CandidatosService);
  private notif  = inject(NotificacionService);
  private router = inject(Router);

  candidatos   = signal<CandidatoItem[]>([]);
  cargando     = signal(true);
  textoBusqueda = '';
  filtroEstado  = '';

  candidatosFiltrados = computed(() => {
    const texto  = this.textoBusqueda.toLowerCase();
    const estado = this.filtroEstado as EstadoCandidato | '';
    return this.candidatos().filter(c => {
      const t = !texto || c.Nombre_Completo.toLowerCase().includes(texto) || c.Correo.toLowerCase().includes(texto);
      const e = !estado || c.Estado === estado;
      return t && e;
    });
  });

  ngOnInit() {
    this.svc.getAll().subscribe({
      next:  c => { this.candidatos.set(c); this.cargando.set(false); },
      error: () => { this.notif.error('Error al cargar candidatos'); this.cargando.set(false); },
    });
  }

  nuevo()             { this.router.navigate(['/analista/candidatos/nuevo']); }
  editar(c: CandidatoItem) { this.router.navigate(['/analista/candidatos', c.Id]); }

  iniciales(n: string): string {
    const p = n.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  }

  badgeEstado(e: EstadoCandidato): string {
    return { 'En proceso': 'primary', 'Seleccionado': 'success', 'Descartado': 'neutral' }[e] ?? 'neutral';
  }
}
