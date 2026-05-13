import type { ImmutableObject } from 'seamless-immutable'

/**
 * Configuracion persistida del widget Buffer.
 */
export interface Config {
  /**
   * Propiedad de ejemplo para mantener compatibilidad con la plantilla de widgets de EXB.
   */
  exampleConfigProperty?: string
}

/**
 * Tipo inmutable de configuracion usado por Experience Builder.
 */
export type IMConfig = ImmutableObject<Config>
