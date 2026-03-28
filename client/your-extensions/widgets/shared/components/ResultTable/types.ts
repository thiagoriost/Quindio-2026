export interface ResultColumn {
  field: string
  label: string
  width?: number
}

export interface ResultTableProps<T = any> {
  data: T[]
  columns: ResultColumn[]
  pageSize?: number
  loading?: boolean

  // comportamiento
  onRowClick?: (row: T) => void
  onBack?: () => void

  // exportación
  enableExport?: boolean
  fileName?: string
  rawFeatures?: __esri.Graphic[]

  // estilo
  selectable?: boolean
}