/**
 * @fileoverview Definición de tipos de configuración del widget printCliente.
 * @module printCliente/config
 */

import type { ImmutableObject } from 'seamless-immutable'

/**
 * Interfaz de configuración del widget.
 * Define las propiedades configurables desde el panel de ajustes.
 * @interface Config
 * @property {string} exampleConfigProperty - Propiedad de ejemplo para configuración personalizada.
 */
export interface Config {
  exampleConfigProperty: string
}

/**
 * Tipo inmutable de la configuración del widget.
 * Utilizado internamente por Experience Builder para manejo de estado.
 * @typedef {ImmutableObject<Config>} IMConfig
 */
export type IMConfig = ImmutableObject<Config>
