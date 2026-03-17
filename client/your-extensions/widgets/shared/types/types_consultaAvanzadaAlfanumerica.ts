export interface LayerInfo {
  id: number
  name: string
}

export interface MapServiceResponse {
  layers: LayerInfo[]
}

export interface FieldInfo {
  name: string
  type: string
}