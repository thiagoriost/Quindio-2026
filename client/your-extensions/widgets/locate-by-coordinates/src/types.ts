export type CoordinateType =
  | "PLANAR"
  | "GEOGRAPHIC_DECIMAL"
  | "GEOGRAPHIC_DMS"

export interface PlanarCoordinates {
  x: number
  y: number
}

export interface GeographicDecimal {
  lat: number
  lon: number
}

export interface GeographicDMS {
  latDeg: number
  latMin: number
  latSec: number
  lonDeg: number
  lonMin: number
  lonSec: number
}