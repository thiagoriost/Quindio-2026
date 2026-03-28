/** @jsx jsx */

import { React, jsx } from 'jimu-core'
import { Select } from 'jimu-ui'
import '../styles/consulta-ambiental.css'

interface OptionItem {
  label: string
  value: string
}

interface OpcionesClasificacion {
  areas: OptionItem[]
  tematicas: OptionItem[]
  categorias: OptionItem[]
  subcategorias?: OptionItem[] // ?: por ahora
  nombres?: OptionItem[] // ?: por ahora
}

interface Props {
  filtros: any
  setFiltro: (campo: string, valor: any) => void
  opciones: OpcionesClasificacion
}

export const FiltrosClasificacion = ({
  filtros,
  setFiltro,
  opciones
}: Props) => {

  const renderOptions = (items: OptionItem[]) => {

    if (!items) return null

    return items.map(item => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))

  }

  return (

    <div className="consulta-ambiental-form">

      {/* Área */}

      <div className="filtro-row">
        <label>Área</label>

        <Select
          value={filtros.area || ''}
          onChange={(e) => setFiltro('area', e.target.value)}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.areas)}
        </Select>
      </div>

      {/* Temática */}

      <div className="filtro-row">
        <label>Temática</label>

        <Select
          disabled={!filtros.area}
          value={filtros.tematica || ''}
          onChange={(e) => setFiltro('tematica', e.target.value)}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.tematicas)}
        </Select>
      </div>

      {/* Categoría */}

      <div className="filtro-row">
        <label>Categoría</label>

        <Select
          disabled={!filtros.tematica}
          value={filtros.categoria || ''}
          onChange={(e) => setFiltro('categoria', e.target.value)}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.categorias)}
        </Select>
      </div>

      {/* Subcategoría */}

      <div className="filtro-row">
        <label>SubCategoría</label>

        <Select
          disabled={!filtros.categoria}
          value={filtros.subcategoria || ''}
          onChange={(e) => setFiltro('subcategoria', e.target.value)}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.subcategorias)}
        </Select>
      </div>

      {/* Nombre */}

      <div className="filtro-row">
        <label>Nombre</label>

        <Select
          disabled={!filtros.subcategoria}
          value={filtros.nombre || ''}
          onChange={(e) => setFiltro('nombre', e.target.value)}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.nombres)}
        </Select>
      </div>

    </div>

  )

}