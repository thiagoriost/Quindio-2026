/**
 * Tipos de coordenadas soportados por el widget.
 */
export type CoordinateType =
  | "PLANAR"
  | "GEOGRAPHIC_DECIMAL"
  | "GEOGRAPHIC_DMS"

/**
 * Coordenadas planas (MAGNA SIRGAS).
 */
export interface PlanarCoordinates {
  x: number
  y: number
}

/**
 * Coordenadas geográficas en decimal.
 */
export interface GeographicDecimal {
  lat: number
  lon: number
}

/**
 * Coordenadas geográficas en grados, minutos y segundos (DMS).
 */
export interface GeographicDMS {
  latDeg: number
  latMin: number
  latSec: number
  lonDeg: number
  lonMin: number
  lonSec: number
}