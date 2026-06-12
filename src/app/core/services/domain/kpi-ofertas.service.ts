import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { SharepointBaseService } from '../sharepoint-base.service';
import { KpiOfertaItem, KpiOfertaCreate } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class KpiOfertasService {
  private sp = inject(SharepointBaseService);
  private S  = ['Id','Periodo','UnidadPeriodo','PorcentajeGarantizado','ValorKPI','ID_OfertaId'];
  private LIST = 'KPI_Ofertas';

  getByOferta(ofertaId: number): Observable<KpiOfertaItem[]> {
    return this.sp.getAll<KpiOfertaItem>(this.LIST, {
      select:    this.S,
      filter:    `ID_OfertaId eq ${ofertaId}`,
      orderBy:   'Periodo',
      ascending: true,
    });
  }

  create(data: KpiOfertaCreate): Observable<any> {
    return this.sp.create(this.LIST, data as any);
  }

  delete(id: number): Observable<void> {
    return this.sp.delete(this.LIST, id);
  }

  // Elimina los KPIs existentes de una oferta y crea los nuevos
  reemplazar(
    ofertaId: number,
    items: Omit<KpiOfertaCreate, 'ID_OfertaId'>[]
  ): Observable<any[]> {
    return new Observable(observer => {
      this.getByOferta(ofertaId).subscribe({
        next: existentes => {
          const crearNuevos = () => {
            if (!items.length) {
              observer.next([]);
              observer.complete();
              return;
            }
            forkJoin(
              items.map(item => this.create({ ...item, ID_OfertaId: ofertaId }))
            ).subscribe({
              next:  res => { observer.next(res); observer.complete(); },
              error: err => observer.error(err),
            });
          };

          if (!existentes.length) {
            crearNuevos();
            return;
          }

          forkJoin(existentes.map(e => this.delete(e.Id))).subscribe({
            next:  crearNuevos,
            error: err => observer.error(err),
          });
        },
        error: err => observer.error(err),
      });
    });
  }
}