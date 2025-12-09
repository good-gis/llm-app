import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import {Model} from '../enums/model';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  private apiUrl = environment.modelKeys[Model.DeepSeek_V3_2].apiUrl;
  private apiKey = environment.modelKeys[Model.DeepSeek_V3_2].apiKey;

  public setCredentials(model: Model): void {
    const config = environment.modelKeys[model];
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
  }

  public getCredentials(): {apiUrl: string, apiKey: string} {
    return {
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
    }
  }
}
