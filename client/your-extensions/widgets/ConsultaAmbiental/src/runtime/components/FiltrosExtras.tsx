/** @jsx jsx */

import { React, jsx } from 'jimu-core'
import { Select } from 'jimu-ui'
import { DatePicker } from 'jimu-ui/basic/date-picker'
import '../styles/consulta-ambiental.css'

interface OptionItem {
  label: string
  value: string | number
}

interface OpcionesExtras {
  anios: OptionItem[]
  municipios: OptionItem[]
}

interface Props {
  filtros: any
  setFiltro: (campo: string, valor: any) => void
  opciones: OpcionesExtras
}

export const FiltrosExtras = ({
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

      {/* Año */}

      <div className="filtro-row">

        <label>Año</label>

        <Select
          value={filtros.anio || ''}
          onChange={(e) => { setFiltro('anio', e.target.value) }}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.anios)}
        </Select>

      </div>

      {/* Municipio */}

      <div className="filtro-row">

        <label>Municipio</label>

        <Select
          value={filtros.municipio || ''}
          onChange={(e) => { setFiltro('municipio', e.target.value) }}
        >
          <option value="">Seleccione</option>
          {renderOptions(opciones.municipios)}
        </Select>

      </div>

      {/* Fecha inicio */}

      <div className="filtro-row">

        <label>Fecha inicio</label>

        <DatePicker
          runtime={true}
          selectedDate={filtros.fechaInicio ?? null}
          onChange={(value) => { setFiltro('fechaInicio', value) }}
        />

      </div>

      {/* Fecha fin */}

      <div className="filtro-row">

        <label>Fecha fin</label>

        <DatePicker
          runtime={true}
          selectedDate={filtros.fechaFin ?? null}
          onChange={(value) => { setFiltro('fechaFin', value) }}
        />

      </div>

    </div>

  )

}