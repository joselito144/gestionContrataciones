import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { PnpConfigService } from './pnp.config';

@Injectable({ providedIn: 'root' })
export class SharepointBaseService {
  constructor(protected pnp: PnpConfigService) {}

  getAll<T>(listName: string, opts: {
    select?: string[]; expand?: string[];
    filter?: string; orderBy?: string;
    ascending?: boolean; top?: number;
  } = {}): Observable<T[]> {
    let q = this.pnp.sp.web.lists.getByTitle(listName).items as any;
    if (opts.select?.length)  q = q.select(...opts.select);
    if (opts.expand?.length)  q = q.expand(...opts.expand);
    if (opts.filter)          q = q.filter(opts.filter);
    if (opts.orderBy)         q = q.orderBy(opts.orderBy, opts.ascending ?? true);
    if (opts.top)             q = q.top(opts.top);
    return from(q() as Promise<T[]>);
  }

  getById<T>(listName: string, id: number, opts: {
    select?: string[]; expand?: string[];
  } = {}): Observable<T> {
    let q = this.pnp.sp.web.lists.getByTitle(listName).items.getById(id) as any;
    if (opts.select?.length) q = q.select(...opts.select);
    if (opts.expand?.length) q = q.expand(...opts.expand);
    return from(q() as Promise<T>);
  }

  create(listName: string, data: Record<string, unknown>): Observable<any> {
    return from(this.pnp.sp.web.lists.getByTitle(listName).items.add(data));
  }

  update(listName: string, id: number, data: Record<string, unknown>): Observable<any> {
    return from(this.pnp.sp.web.lists.getByTitle(listName).items.getById(id).update(data));
  }

  delete(listName: string, id: number): Observable<void> {
    return from(this.pnp.sp.web.lists.getByTitle(listName).items.getById(id).delete());
  }
}
