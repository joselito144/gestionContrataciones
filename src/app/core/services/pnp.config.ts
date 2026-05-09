import { Injectable } from '@angular/core';
import { spfi, SPFx, SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import '@pnp/sp/site-users';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PnpConfigService {
  private _sp: SPFI | null = null;

  get sp(): SPFI {
    if (!this._sp) {
      this._sp = spfi(environment.sharepointSiteUrl).using(
        SPFx({ pageContext: { web: { absoluteUrl: environment.sharepointSiteUrl } } } as any)
      );
    }
    return this._sp;
  }
}
