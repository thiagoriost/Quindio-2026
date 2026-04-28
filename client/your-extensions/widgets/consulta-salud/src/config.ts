import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
    urlSalud: string,
    urlSaludAlfanumerico: string,    
    layerSaludAlfanumericoCategoriaIndicadores: number,
    tipoEstablecimientos: Record<string, string>
}

export type IMConfig = ImmutableObject<Config>
