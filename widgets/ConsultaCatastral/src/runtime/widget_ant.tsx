/** @jsx jsx */
import { React, jsx, DataSourceComponent, FeatureLayerDataSource } from 'jimu-core'
import { Select, Option, TextInput, Button } from 'jimu-ui'
import { useEffect, useState } from 'react'

export default function Widget(props: any) {

    console.log('useDataSources:', props.useDataSources)

    const [municipios, setMunicipios] = useState<any[]>([])
    const [municipio, setMunicipio] = useState('')
    const [zona, setZona] = useState('')
    const [predial, setPredial] = useState('')
    const [error, setError] = useState('')

    // 🔹 SOLO se ejecuta cuando el DataSource está READY
    const onMunicipiosDSReady = async (ds: FeatureLayerDataSource) => {
        console.log('Municipios DS READY', ds)

        const result = await ds.query({
            where: 'dane BETWEEN 63001 AND 63999',
            outFields: ['dane', 'nombre_ent'],
            returnGeometry: false
        })

        const lista = result.records
            .map(r => ({
                value: String(r.getFieldValue('dane')),
                label: r.getFieldValue('nombre_ent')
            }))
            .sort((a, b) => a.label.localeCompare(b.label))

        setMunicipios(lista)
    }

    return (
        <div style={{ padding: 12 }}>

            {/* 🚨 ESTO ES LO QUE TE FALTABA */}
            <DataSourceComponent
                useDataSource={props.useDataSources?.[0]}
                onDataSourceCreated={(dataSource) => {
                    console.log('dataSource:', dataSource)
                    onMunicipiosDSReady(dataSource as FeatureLayerDataSource)
                }}
            />

            <Select
                value={municipio}
                onChange={e => setMunicipio(e.target.value)}
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
                onChange={e => setZona(e.target.value)}
                style={{ marginTop: 8 }}
            >
                <Option value="Rural">Rural</Option>
                <Option value="Urbano">Urbano</Option>
            </Select>

            <TextInput
                value={predial}
                onChange={e => setPredial(e.target.value.replace(/\D/g, ''))}
                placeholder="Número predial"
                style={{ marginTop: 8 }}
            />

            {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button type="primary">Buscar</Button>
                <Button onClick={() => {
                    setMunicipio('')
                    setZona('')
                    setPredial('')
                    setError('')
                }}>
                    Limpiar
                </Button>
            </div>

        </div>
    )
}
