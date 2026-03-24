export interface LayerInfo {
  id: number
  name: string
  nameServicio?: string
  url?: string
}

export interface MapServiceResponse {
  layers: LayerInfo[]
}

export interface FieldInfo {
  name: string
  type: string
}