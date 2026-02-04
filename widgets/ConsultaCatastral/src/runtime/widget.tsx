/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Select, Option, TextInput, Button } from 'jimu-ui'
import { useEffect, useState } from 'react'

export default function Widget() {

  // -----------------------------
  // Estados
  // -----------------------------
  const [municipios, setMunicipios] = useState<Array<{ value: string; label: string }>>([])
  const [municipio, setMunicipio] = useState<string>('')
  const [zona, setZona] = useState<string>('')
  const [predial, setPredial] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // -----------------------------
  // Cargar municipios (WFS)
  // -----------------------------
  const cargarMunicipios = async () => {
    try {
      setLoading(true)

      const url =
        'https://geoserver.cntindigena.org:9443/geoserver/INDIGENA/wfs' +
        '?service=WFS' +
        '&version=1.1.0' +
        '&request=GetFeature' +
        '&typename=INDIGENA:limite_municipal' +
        '&outputFormat=json' +
        '&PropertyName=dane,nombre_ent' +
        '&CQL_FILTER=dane BETWEEN 63001 AND 63999'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Error consultando municipios')
      }

      const geojson = await response.json()

      const lista = geojson.features
        .map((f: any) => ({
          value: String(f.properties.dane),
          label: f.properties.nombre_ent
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label))

      setMunicipios(lista)

    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar los municipios')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Ejecutar al iniciar
  // -----------------------------
  useEffect(() => {
    cargarMunicipios()
  }, [])

  // -----------------------------
  // Validación predial
  // -----------------------------
  const esPredialValido = (v: string) =>
    /^\d{15}$|^\d{20}$/.test(v)

  // -----------------------------
  // Buscar
  // -----------------------------
  const onBuscar = () => {
    setError('')

    if (!municipio || !zona || !predial) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (!esPredialValido(predial)) {
      setError('El número predial debe tener 15 o 20 dígitos')
      return
    }

    console.log('Consulta:', { municipio, zona, predial })
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 12 }}>

      <Select
        value={municipio}
        onChange={(evt: any) => setMunicipio(evt)}
        placeholder={loading ? 'Cargando municipios...' : 'Seleccione municipio'}
        disabled={loading}
      >
        {municipios.map(m => (
          <Option key={m.value} value={m.value}>
            {m.label}
          </Option>
        ))}
      </Select>

      <Select
        value={zona}
        onChange={(evt: any) => setZona(evt)}
        style={{ marginTop: 8 }}
        placeholder="Seleccione zona"
      >
        <Option value="Rural">Rural</Option>
        <Option value="Urbano">Urbano</Option>
      </Select>

      <TextInput
        value={predial}
        onChange={(evt: any) => setPredial(evt.target.value.replace(/\D/g, ''))}
        placeholder="Número predial"
        style={{ marginTop: 8 }}
      />

      {error && (
        <div style={{ color: 'red', marginTop: 6 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={onBuscar}>
          Buscar
        </Button>

        <Button
          onClick={() => {
            setMunicipio('')
            setZona('')
            setPredial('')
            setError('')
          }}
        >
          Limpiar
        </Button>
      </div>

    </div>
  )
}
