/**
 * @fileoverview Widget de demostración para búsqueda de predios.
 * Implementa un formulario con validación y uso del componente SearchActionBar.
 *
 * @module test-botonera/widget
 * @requires jimu-core
 * @requires jimu-ui
 * @requires shared/components/search-action-bar
 *
 * @author IGAC - DIP
 * @since 2024
 */

/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { useState } from 'react'
import { Select, Option, TextInput } from 'jimu-ui'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import './style.scss'

/**
 * Lista de municipios disponibles para selección.
 * @constant {Array<{value: string, label: string}>}
 */
const municipios = [
  { value: '63192', label: 'CIRCASIA' },
  { value: '63272', label: 'FILANDIA' },
  { value: '63690', label: 'SALENTO' }
]

/**
 * Widget de demostración que muestra un formulario de búsqueda de predios.
 * Utiliza el componente compartido SearchActionBar para las acciones.
 *
 * @component
 * @returns {JSX.Element} Formulario de búsqueda con validación
 *
 * @example
 * // Uso en Experience Builder
 * <Widget />
 */
const Widget = () => {

  /** @type {string} Código del municipio seleccionado */
  const [municipio, setMunicipio] = useState('')
  /** @type {string} Zona seleccionada (Rural/Urbano) */
  const [zona, setZona] = useState('')
  /** @type {string} Número predial ingresado */
  const [predial, setPredial] = useState('')
  /** @type {string} Mensaje de error de validación */
  const [error, setError] = useState('')

  /** @type {boolean} Indica si la búsqueda está en progreso */
  const [loading, setLoading] = useState(false)
  /** @type {boolean} Indica si el formulario pasó la validación */
  const [formValido, setFormValido] = useState(false)

  /**
   * Valida los campos del formulario.
   * Verifica que municipio, zona y número predial estén correctamente completados.
   *
   * @returns {boolean} true si el formulario es válido, false en caso contrario
   */
  const validarFormulario = () => {
    if (!municipio) {
      setError('Debe seleccionar un municipio')
      return false
    }

    if (!zona) {
      setError('Debe seleccionar una zona')
      return false
    }

    if (!predial || predial.length < 10) {
      setError('El número predial debe tener al menos 10 dígitos')
      return false
    }

    setError('')
    return true
  }

  /**
   * Manejador del evento de búsqueda.
   * Valida el formulario y simula una llamada al servicio.
   *
   * @returns {void}
   */
  const handleBuscar = () => {

    const esValido = validarFormulario()
    setFormValido(esValido)

    if (!esValido) return

    console.log('Buscar ejecutado correctamente')

    setLoading(true)

    // Simulación de servicio
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  /**
   * Manejador del evento de limpieza.
   * Restablece todos los campos del formulario a su estado inicial.
   *
   * @returns {void}
   */
  const handleLimpiar = () => {

    console.log('Formulario limpiado')

    setMunicipio('')
    setZona('')
    setPredial('')
    setError('')
    setFormValido(false)
  }

  return (
    <div className="widget-container">

      <div className="widget-content">

        <Select
          value={municipio}
          onChange={(e) => { setMunicipio(e.target.value) }}
          placeholder="Seleccione municipio"
        >
          {municipios.map(m => (
            <Option key={m.value} value={m.value}>
              {m.label}
            </Option>
          ))}
        </Select>

        <Select
          value={zona}
          onChange={(e) => { setZona(e.target.value) }}
          placeholder="Seleccione zona"
          style={{ marginTop: 8 }}
        >
          <Option value="Rural">Rural</Option>
          <Option value="Urbano">Urbano</Option>
        </Select>

        <TextInput
          value={predial}
          placeholder="Número predial"
          onChange={(e) => { setPredial(e.target.value.replace(/\D/g, '')) }}
          style={{ marginTop: 8 }}
        />

        {error && (
          <div style={{ color: 'red', marginTop: 6 }}>
            {error}
          </div>
        )}

      </div>

      <SearchActionBar
        onSearch={handleBuscar}
        onClear={handleLimpiar}
        loading={loading}
        disableSearch={loading}
      />

    </div>
  )
}

export default Widget
