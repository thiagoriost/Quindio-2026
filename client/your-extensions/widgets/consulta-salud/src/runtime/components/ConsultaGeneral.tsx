/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'
const { useEffect, useImperativeHandle, forwardRef, useRef } = React

import type { ConsultaComponentHandle, ConsultaGeneralProps } from '../consulta-general-types'
import type { ArcGisFeature, ArcGisField, SelectOption } from '../types'
import { arrayValueLabel, handleError, listarCapas, queryCapa } from '../util'
import SelectMunicipio from './SelectMunicipio'
import SelectDesdeArray from './SelectDesdeArray'

const ConsultaGeneral = forwardRef<ConsultaComponentHandle, ConsultaGeneralProps>(({
    loading,
    execute,
    url,
    idMunicipio,
    setIdMunicipio,
    municipios,
    setMessage,
    arcgisService,
    httpService
}, ref) => {
    const [tipoEstablecimientos, setTipoEstablecimientos] = React.useState<SelectOption[]>([])
    const [idTipoEstablecimiento, setIdTipoEstablecimiento] = React.useState('')
    const [instituciones, setInstituciones] = React.useState<SelectOption[]>([])
    const [institucion, setInstitucion] = React.useState<string>('')

    const resultadosRef = useRef<{
        features: ArcGisFeature[]
        fields: ArcGisField[]
        spatialReference?: __esri.SpatialReference
    }>({
        features: [],
        fields: [],
        spatialReference: undefined
    })

    const getFeatures = () => (
        institucion
            ? resultadosRef.current.features.filter((feature) => String(feature.attributes?.OBJECTID ?? '') === institucion)
            : resultadosRef.current.features
    )

    useImperativeHandle(ref, () => ({
        consultar: async () => {
            const features = getFeatures()

            return {
                features,
                fields: resultadosRef.current.fields,
                spatialReference: resultadosRef.current.spatialReference
            }
        },
        getFeatures: () => getFeatures(),
        limpiar: () => {
            setIdTipoEstablecimiento('')
            setInstitucion('')
            setInstituciones([])
            setIdMunicipio('')
        }
    }), [institucion, setIdMunicipio])

    useEffect(() => {
        const initConsultaGeneral = async () => {
            await cargarTiposEstablecimiento(execute, httpService, url, setTipoEstablecimientos)
        }

        void initConsultaGeneral()
    }, [])

    useEffect(() => {
        const cargarInstituciones = async () => {
            if (!idMunicipio || !idTipoEstablecimiento) {
                resultadosRef.current = {
                    features: [],
                    fields: [],
                    spatialReference: undefined
                }
                setInstituciones([])
                return
            }

            const response = await queryCapa(execute, arcgisService, url, parseInt(idTipoEstablecimiento, 10), {
                where: `IDMUNICIPIO="${idMunicipio}"`,
                outFields: '*',
                returnGeometry: true
            })

            if (handleError(response, setMessage) === -1) {
                return
            }

            const features = response.data.features || []; 
            const fields = response.data.fields;
            const spatialReference = response.data.spatialReference

            resultadosRef.current = {
                features,
                fields,
                spatialReference
            }            

            setInstituciones(arrayValueLabel(features, 'OBJECTID', 'NOMBREEQUIPAMIENTO'))
            setInstitucion('')

            if (!features.length) {
                setMessage('No se encontraron instituciones para los filtros seleccionados')
            }
        }

        void cargarInstituciones()
    }, [idMunicipio, idTipoEstablecimiento])

    return (
        <PanelConsulta
        idTipoEstablecimiento={idTipoEstablecimiento}
        setIdTipoEstablecimiento={setIdTipoEstablecimiento}
        instituciones={instituciones}
        institucion={institucion}
        setInstitucion={setInstitucion}
        loading={loading}
        tipoEstablecimientos={tipoEstablecimientos}
        municipios={municipios}
        idMunicipio={idMunicipio}
        setIdMunicipio={setIdMunicipio}
        />
    )
})

function PanelConsulta({
    idTipoEstablecimiento,
    setIdTipoEstablecimiento,
    instituciones,
    institucion,
    setInstitucion,
    loading,
    tipoEstablecimientos,
    municipios,
    idMunicipio,
    setIdMunicipio
}) {
    return (
        <>
            <Label>Categoría</Label>
            <Select
                value={idTipoEstablecimiento}
                onChange={(e) => {
                    setIdTipoEstablecimiento(e.target.value)
                    setInstitucion('')
                }}
                disabled={loading || tipoEstablecimientos.length === 0}
            >
                <Option value="">Seleccione...</Option>

                {tipoEstablecimientos.map((option) => (
                    <Option key={option.value} value={option.value}>
                        {option.label}
                    </Option>
                ))}
            </Select>

            <SelectMunicipio loading={loading} municipios={municipios} idMunicipio={idMunicipio} setIdMunicipio={setIdMunicipio} />

            <SelectDesdeArray label={'Institución'} valor={institucion} setValor={setInstitucion} array={instituciones} disabled={loading} />
        </>
    )
}

export default ConsultaGeneral

async function cargarTiposEstablecimiento(execute, httpService, url, setTipoEstablecimientos) {
    const response = await listarCapas(execute, httpService, url)
    const layers = response.data?.layers ?? []

    const opciones = layers.map((layer) => ({
        value: String(layer.id),
        label: String(layer.name)
    }))

    setTipoEstablecimientos(opciones.sort((a, b) => a.label.localeCompare(b.label)))
}