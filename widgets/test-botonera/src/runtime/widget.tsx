/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { useState } from 'react'
import { Select, Option, TextInput } from 'jimu-ui'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import './style.scss'

const municipios = [
  { value: '63192', label: 'CIRCASIA' },
  { value: '63272', label: 'FILANDIA' },
  { value: '63690', label: 'SALENTO' }
]

const Widget = () => {

  const [municipio, setMunicipio] = useState('')
  const [zona, setZona] = useState('')
  const [predial, setPredial] = useState('')
  const [error, setError] = useState('')

  const [loading, setLoading] = useState(false)
  const [formValido, setFormValido] = useState(false)

  // 🔎 Validación simple del formulario
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
          onChange={(e) => setMunicipio(e.target.value)}
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
          onChange={(e) => setZona(e.target.value)}
          placeholder="Seleccione zona"
          style={{ marginTop: 8 }}
        >
          <Option value="Rural">Rural</Option>
          <Option value="Urbano">Urbano</Option>
        </Select>

        <TextInput
          value={predial}
          placeholder="Número predial"
          onChange={(e) => setPredial(e.target.value.replace(/\D/g, ''))}
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
