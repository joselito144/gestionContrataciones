import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { AprobadoresService } from './domain';
import { AuthService } from './auth.service';
import { AprobadorItem, CargoAprobador } from '../../shared/models';

// ── Servicio auxiliar para verificaciones de aprobador en componentes ─────────
// Complementa el guard — úsalo en ngOnInit de componentes de aprobación
// para tener la info del aprobador disponible en el template.

export interface InfoAprobador {
  esAprobador: boolean;
  cargo: CargoAprobador | null;
  item: AprobadorItem | null;
}

@Injectable({ providedIn: 'root' })
export class AprobadorCheckService {
  private auth     = inject(AuthService);
  private aprobSvc = inject(AprobadoresService);

  // Verifica si el usuario actual es aprobador y devuelve su cargo
  verificar(): Observable<InfoAprobador> {
    const email = this.auth.usuario()?.email?.toLowerCase() ?? '';

    return this.aprobSvc.getActivos().pipe(
      map(aprobadores => {
        const item = aprobadores.find(
          a => a.Persona.EMail.toLowerCase() === email
        ) ?? null;
        return {
          esAprobador: !!item,
          cargo:       item?.Cargo ?? null,
          item,
        };
      }),
      catchError(() => of({ esAprobador: false, cargo: null, item: null }))
    );
  }

  // Verifica si el usuario es aprobador de un cargo específico
  esCargo(cargo: CargoAprobador): Observable<boolean> {
    return this.verificar().pipe(
      map(info => info.cargo === cargo)
    );
  }
}