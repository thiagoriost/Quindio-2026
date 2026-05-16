import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
    endpointOrdenamientoTerritorial: string,
    endpointArchivos: string
}

export type IMConfig = ImmutableObject<Config>
