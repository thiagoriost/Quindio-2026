/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button, Select, Option, TextInput } from 'jimu-ui'
import { useState } from 'react'

// estado del formulario
const municipios = [
    { value: '63192', label: 'CIRCASIA' },
    { value: '63272', label: 'FILANDIA' },
    { value: '63690', label: 'SALENTO' }
]

export default function Widget() {
    const [municipio, setMunicipio] = useState('')
    const [zona, setZona] = useState('')
    const [predial, setPredial] = useState('')
    const [error, setError] = useState('')

    // Validación del número predial
    const validarPredial = (value: string) => {
        const regex = /^\d{15}$|^\d{20}$/
        return regex.test(value)
    }

    // Boton buscar
    const onBuscar = () => {
        setError('')

        if (!municipio || !zona || !predial) {
            setError('Todos los campos son obligatorios')
            return
        }

        if (!validarPredial(predial)) {
            setError('El número predial debe tener 15 o 20 dígitos')
            return
        }

        const filtros = {
            municipio,
            zona,
            predial
        }

        console.log('🔍 Buscar con:', filtros)

        // aquí puedes:
        // - lanzar una consulta
        // - emitir un message action
        // - llamar un servicio REST
    }


    //boton limpiar
    const onLimpiar = () => {
        setMunicipio('')
        setZona('')
        setPredial('')
        setError('')
    }

    // reder del formulario

    return (
        <div style={{ padding: 12 }}>

            <Select
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Seleccione municipio"
            >
                {municipios.map(m => (
                    <Option key={m.value} value={m.value}>{m.label}</Option>
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

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button type="primary" onClick={onBuscar}>
                    Buscar
                </Button>

                <Button onClick={onLimpiar}>
                    Limpiar
                </Button>
            </div>

        </div>
    )
}