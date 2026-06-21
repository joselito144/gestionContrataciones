import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SharepointBaseService } from '../sharepoint-base.service';
import { SP_LISTS } from '../sp-lists.constants';
import { PlantillaDocumentoItem } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class PlantillasDocumentoService {
  private sp = inject(SharepointBaseService);
  private S  = ['Id','Title','NombreArchivo','Activo','Orden'];

  getActivas(): Observable<PlantillaDocumentoItem[]> {
    return this.sp.getAll<PlantillaDocumentoItem>(SP_LISTS.PLANTILLAS_DOCUMENTO, {
      select:    this.S,
      filter:    'Activo eq 1',
      orderBy:   'Orden',
      ascending: true,
    });
  }

  getAll(): Observable<PlantillaDocumentoItem[]> {
    return this.sp.getAll<PlantillaDocumentoItem>(SP_LISTS.PLANTILLAS_DOCUMENTO, {
      select:  this.S,
      orderBy: 'Orden',
    });
  }

  create(data: Omit<PlantillaDocumentoItem, 'Id'>): Observable<any> {
    return this.sp.create(SP_LISTS.PLANTILLAS_DOCUMENTO, data as any);
  }

  update(id: number, data: Partial<PlantillaDocumentoItem>): Observable<any> {
    return this.sp.update(SP_LISTS.PLANTILLAS_DOCUMENTO, id, data as any);
  }

  toggleActivo(id: number, activo: boolean): Observable<any> {
    return this.sp.update(SP_LISTS.PLANTILLAS_DOCUMENTO, id, { Activo: activo });
  }

  delete(id: number): Observable<void> {
    return this.sp.delete(SP_LISTS.PLANTILLAS_DOCUMENTO, id);
  }
}