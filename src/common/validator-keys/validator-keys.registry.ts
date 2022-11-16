import { Injectable } from '@nestjs/common';

export type KeysRegistry = Map<Identity, Alias>;

export type Identity = string;
export type Alias = string;

@Injectable()
export class ValidatorKeysRegistryService {
  protected registry: KeysRegistry;

  constructor() {
    this.registry = new Map<Identity, Alias>();
  }

  get size() {
    return this.registry.size;
  }

  public get(id: Identity) {
    return this.registry.get(id);
  }

  public set(id: Identity, alias: Alias) {
    this.registry.set(id, alias);
  }

  public clear() {
    this.registry.clear();
  }
}
