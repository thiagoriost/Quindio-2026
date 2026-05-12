/** @jsx jsx */
import { React, jsx } from 'jimu-core'
const { useEffect, useState, forwardRef, useImperativeHandle } = React

import type { SelectOption } from '../types'
import { arrayValueLabel, handleError, listarCapas, queryCapa } from '../util'
import SelectAnio, { cargarAniosDesdeREST } from './SelectAnio'
import SelectDesdeArray from './SelectDesdeArray'

const VIOLENCIA_INTRAFAMILIAR = "1"
const INDICADOR_AFILIACIONES = "3"
const INDICADORES_MORBILIDAD = "4"
const INDICADORES_MORTALIDAD = "5"
const INDICADORES_NATALIDAD = "6"
const COBERTURA_VACUNACION = "9"
const AFILIACIONES_FIELD = 'COBERTURATOTAL'
const COBERTURA_VACUNACION_FIELD = 'PORCENTAJE'
const VIOLENCIA_INTRAFAMILIAR_FIELD = 'TASA10000'
const MORBILIDAD_FIELD = 'NUMEROCASOS'

const asignarSpatialReferenceAGeometrias = (features: any[], spatialReference?: any) => {
    if (!spatialReference) {
        return features ?? []
    }

    return (features ?? []).map((feature: any) => {
        if (!feature?.geometry || feature.geometry.spatialReference) {
            return feature
        }

        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                spatialReference
            }
        }
    })
}

const construirLeyendaCoropletica = (features: any[], field: string) => {
    const valores = (features ?? [])
        .map((feature: any) => Number(feature?.attributes?.[field]))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)

    if (!valores.length) {
        return []
    }

    const minimo = valores[0]
    const maximo = valores[valores.length - 1]

    if (minimo === maximo) {
        return [{
            minimo,
            maximo,
            label: `${minimo.toLocaleString('es-CO')}`,
            colorFondo: '31,119,180,0.7',
            colorLine: '31,119,180,1'
        }]
    }

    const totalRangos = Math.min(4, valores.length)
    const paleta = [
        { colorFondo: '255,245,235,0.7', colorLine: '254,153,41,1' },
        { colorFondo: '254,230,206,0.7', colorLine: '253,141,60,1' },
        { colorFondo: '253,174,107,0.7', colorLine: '230,85,13,1' },
        { colorFondo: '230,85,13,0.7', colorLine: '166,54,3,1' }
    ]

    return Array.from({ length: totalRangos }, (_, index) => {
        const startIndex = Math.floor((index * valores.length) / totalRangos)
        const endIndex = Math.floor((((index + 1) * valores.length) / totalRangos) - 1)
        const rangoMin = valores[startIndex]
        const rangoMax = valores[Math.max(startIndex, endIndex)]

        return {
            minimo: rangoMin,
            maximo: rangoMax,
            label: `${rangoMin.toLocaleString('es-CO')} - ${rangoMax.toLocaleString('es-CO')}`,
            colorFondo: paleta[index].colorFondo,
            colorLine: paleta[index].colorLine
        }
    })
}

const construirDatosGrafico = (features: any[], field: string) => {
    return (features ?? [])
        .map((feature: any) => {
            const nombreLugar = String(feature?.attributes?.NOMBRE ?? '').trim()
            const valor = Number(feature?.attributes?.[field] ?? 0)

            if (!nombreLugar || !Number.isFinite(valor)) {
                return null
            }

            return {
                name: nombreLugar,
                value: valor
            }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
}

const ConsultaIndicadores = forwardRef((
{
    loading,
    execute,
    url,
    setMessage,
    arcgisService,
    httpService
}, ref) => {
    const [indicadores, setIndicadores] = useState<SelectOption[]>([])
    const [indicador, setIndicador] = useState('')

    const [categoriasIndicadores, setCategoriasIndicadores] = useState<SelectOption[]>([])
    const [idCategoria, setIdCategoria] = useState('')

    const [anios, setAnios] = useState<SelectOption[]>([])
    const [anio, setAnio] = useState('')

    useImperativeHandle(ref, () => ({
        consultar: async () => {
            const whereParts: string[] = []

            if (anio) {
                whereParts.push(`ANIO=${anio}`)
            }

            if (idCategoria && indicador !== INDICADORES_MORTALIDAD && indicador !== INDICADORES_NATALIDAD)
                whereParts.push(`VALORDOMINIO=${idCategoria}`)

            const where = whereParts.length > 0 ? whereParts.join(' AND ') : '1=1'
            
            const params = (()=> {
                if (indicador === COBERTURA_VACUNACION) { 
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: 'NOMBRE, ANIO, PORCENTAJE',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else if (indicador === VIOLENCIA_INTRAFAMILIAR) {
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: 'NOMBRE, ANIO, FRECUENCIA, PORCENTAJE, TASA10000',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else if (indicador === INDICADORES_MORBILIDAD) {
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: 'NOMBRE, ANIO, TIPO_MORBILIDAD, NUMEROCASOS',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else if (indicador === INDICADORES_MORTALIDAD) {
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: 'NOMBRE, ANIO, TASAGENERAL, TASAINFANTIL, TASAPERINATAL, TASASUICIDIO, TASACANCER',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else if (indicador === INDICADORES_NATALIDAD) {
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: 'NOMBRE, ANIO, TASAGENERAL, TASAGLOBALFECUNDIDAD, TASAFECUNDIDADADOLESCENTE',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else if (indicador === INDICADOR_AFILIACIONES) {
                    return {
                        where: where,
                        returnGeometry: true,
                        outFields: '*',
                        orderByFields: 'NOMBRE ASC'
                    }
                } else {
                    return {
                        where: where,
                        returnGeometry: false,
                        outFields: '*',
                        orderByFields: 'ANIO DESC'
                    }
                }
            })();

            const response = await queryCapa(execute, arcgisService, url, indicador, params)

            if (handleError(response, setMessage) === -1)
                return

            const spatialReference = response.data?.spatialReference
            const features = asignarSpatialReferenceAGeometrias(
                response.data?.features ?? [],
                spatialReference
            )
            const categoriaAfiliacion = categoriasIndicadores.find(c => c.value === idCategoria)?.label ?? 'categoría'
            const coroplethField = (() => {
                if (indicador === INDICADOR_AFILIACIONES) {
                    return AFILIACIONES_FIELD
                } else if (indicador === COBERTURA_VACUNACION) {
                    return COBERTURA_VACUNACION_FIELD
                } else if (indicador === VIOLENCIA_INTRAFAMILIAR) {
                    return VIOLENCIA_INTRAFAMILIAR_FIELD
                } else if (indicador === INDICADORES_MORBILIDAD) {
                    return MORBILIDAD_FIELD
                } else if (indicador === INDICADORES_MORTALIDAD || indicador === INDICADORES_NATALIDAD) {
                    return idCategoria
                }

                return undefined
            })()
            const leyendaCoropletica = coroplethField
                ? construirLeyendaCoropletica(features, coroplethField)
                : []
            ;

            let datosGrafico = null;
            //let featuresEnvio = null;
            let fieldsEnvio = null;
            
            if ( indicador === INDICADOR_AFILIACIONES ) {
                datosGrafico = construirDatosGrafico(features, AFILIACIONES_FIELD);                
                fieldsEnvio = [{ name: 'NOMBRE', alias: 'Municipio' }, { name: "COBERTURATOTAL", alias: 'Cobertura total' }]
            } else {                
                fieldsEnvio=response.data.fields;
            }

            return {
                //features: featuresEnvio,
                features,
                fields: fieldsEnvio,
                //fields:response.data.fields,
                spatialReference,
                withGraphic: (()=>{
                    if ( indicador === INDICADOR_AFILIACIONES ) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: datosGrafico,
                            graphicType: 'bar',
                            graphicTitle: `Población cubierta por municipio${anio ? `, año ${anio}` : ''}${idCategoria ? `, ${categoriaAfiliacion}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: [{ field: AFILIACIONES_FIELD, label: 'Cobertura total' }],
                                    label: 'Cobertura total',
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? AFILIACIONES_FIELD : undefined
                        })
                    } else if (indicador === COBERTURA_VACUNACION) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: construirDatosGrafico(features, COBERTURA_VACUNACION_FIELD),
                            graphicType: 'bar',
                            graphicTitle: `Cobertura de vacunación por municipio${anio ? `, año ${anio}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: [{ field: COBERTURA_VACUNACION_FIELD, label: 'Porcentaje' }],
                                    label: 'Porcentaje',
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? COBERTURA_VACUNACION_FIELD : undefined
                        })
                    } else if (indicador === VIOLENCIA_INTRAFAMILIAR) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: construirDatosGrafico(features, VIOLENCIA_INTRAFAMILIAR_FIELD),
                            graphicType: 'bar',
                            graphicTitle: `Violencia intrafamiliar por municipio${anio ? `, año ${anio}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: [{ field: VIOLENCIA_INTRAFAMILIAR_FIELD, label: 'Tasa por 10.000 habitantes' }],
                                    label: 'Tasa por 10.000 habitantes',
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? VIOLENCIA_INTRAFAMILIAR_FIELD : undefined
                        })
                    } else if (indicador === INDICADORES_MORBILIDAD) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: construirDatosGrafico(features, MORBILIDAD_FIELD),
                            graphicType: 'bar',
                            graphicTitle: `Morbilidad por municipio${anio ? `, año ${anio}` : ''}${idCategoria ? `, ${categoriaAfiliacion}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: [{ field: MORBILIDAD_FIELD, label: 'Número de casos' }],
                                    label: 'Número de casos',
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? MORBILIDAD_FIELD : undefined
                        })
                    } else if (indicador === INDICADORES_MORTALIDAD) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: construirDatosGrafico(features, idCategoria),
                            graphicType: 'bar',
                            graphicTitle: `Mortalidad por municipio${anio ? `, año ${anio}` : ''}${idCategoria ? `, ${categoriaAfiliacion}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: idCategoria ? [{ field: idCategoria, label: categoriaAfiliacion }] : [],
                                    label: categoriaAfiliacion,
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? idCategoria : undefined
                        })
                    } else if (indicador === INDICADORES_NATALIDAD) {
                        return (
                        {
                            showGraphic: true,
                            graphicData: construirDatosGrafico(features, idCategoria),
                            graphicType: 'bar',
                            graphicTitle: `Natalidad por municipio${anio ? `, año ${anio}` : ''}${idCategoria ? `, ${categoriaAfiliacion}` : ''}`,
                            dataCoropletico: leyendaCoropletica.length > 0
                                ? {
                                    fieldsToFilter: idCategoria ? [{ field: idCategoria, label: categoriaAfiliacion }] : [],
                                    label: categoriaAfiliacion,
                                    leyenda: leyendaCoropletica
                                }
                                : undefined,
                            fieldToFilter: leyendaCoropletica.length > 0 ? idCategoria : undefined
                        })
                    } else return { showGraphic: false, graphicData: [], graphicType: 'bar', selectedIndicador: 0 }
                })()
              
            }
        },
        limpiar: () => {
            setIndicador('')
            setCategoriasIndicadores([])
            setIdCategoria('')
            setAnios([])
            setAnio('')
        }
    }), [indicador, anio, idCategoria, categoriasIndicadores])

    useEffect(() => {
        const initConsultaIndicadores = async () => {
            await cargarIndicadores(execute, httpService, url, setIndicadores, setMessage)
        }

        void initConsultaIndicadores()
    }, [])

    useEffect(() => {
        const cargarCategoriasDesdeREST = async () => {
            setCategoriasIndicadores([])
            setMessage('')

            const indice = {
                '0': 'TIPO_SERVICIO',
                '2': 'TIPO_CAPACIDAD',
                '3': 'TIPO_AFILIACION',
                '4': 'TIPO_MORBILIDAD'
            }

            const campo = indice['' + indicador]

            if (!campo)
                return

            const response = await queryCapa(execute, arcgisService, url, indicador,
                {
                    f: 'json',
                    where: '1=1',
                    returnGeometry: false,
                    outFields: campo +", VALORDOMINIO",
                    returnDistinctValues: true,
                    orderByFields: `${campo} ASC`
                }
            )

            if (handleError(response, setMessage) === -1)
                return

            const features = response.data?.features ?? []
            const lista = arrayValueLabel(features, "VALORDOMINIO", campo)
            setCategoriasIndicadores(lista)
        }

        setCategoriasIndicadores([])
        setAnios([])

        if (indicador === INDICADOR_AFILIACIONES || indicador === INDICADORES_MORBILIDAD)
            void cargarCategoriasDesdeREST()
        else if (indicador === INDICADORES_MORTALIDAD) {
            setCategoriasIndicadores([
                { value: 'TASAGENERAL', label: 'Tasa General' },
                { value: 'TASAINFANTIL', label: 'Tasa Infantil' },
                { value: 'TASAPERINATAL', label: 'Tasa Perinatal' },
                { value: 'TASASUICIDIO', label: 'Tasa de Suicidio' },
                { value: 'TASACANCER', label: 'Tasa de Cáncer' }
            ].sort((a: any, b: any) => a.label.localeCompare(b.label)))
        } else if (indicador === INDICADORES_NATALIDAD) {
            setCategoriasIndicadores([
                { value: 'TASAGENERAL', label: 'Tasa General' },
                { value: 'TASAGLOBALFECUNDIDAD', label: 'Tasa global de fecundidad' },
                { value: 'TASAFECUNDIDADADOLESCENTE', label: 'Tasa de fecundidad adolescente' }
            ].sort((a: any, b: any) => a.label.localeCompare(b.label)))
        }

        void cargarAniosDesdeREST(setAnios, execute, arcgisService, url, indicador, setMessage)
    }, [indicador]);

    useEffect(() => {
        setMessage('nuevo idCategoria ' + idCategoria)
    }, [idCategoria]);

    return(
        <>
        <SelectDesdeArray label={'Indicador'} valor={indicador} setValor={setIndicador} array={indicadores} disabled={loading} />

        {(indicador != VIOLENCIA_INTRAFAMILIAR && indicador != COBERTURA_VACUNACION) && (
            <SelectDesdeArray label={'Categoría'} valor={idCategoria} setValor={setIdCategoria} array={categoriasIndicadores}
            disabled={loading || !indicador || categoriasIndicadores.length === 0} />
        )}

        <SelectAnio loading={loading} anios={anios} anio={anio} setAnio={setAnio}/>
        </>
    )
})

export default ConsultaIndicadores

async function cargarIndicadores(execute, httpService, url, setIndicadores, setMessage) {
    setMessage('url ' + url)
    const response = await listarCapas(execute, httpService, url)
    const layers = response.data?.layers ?? []
    const idsPermitidos = new Set([1, 3, 4, 5, 6, 9])

    const opciones = layers
        .filter((item) => idsPermitidos.has(item.id))
        .map((item) => ({
            value: String(item.id),
            label: String(item.name)
        }))

    setIndicadores(opciones.sort((a, b) => a.label.localeCompare(b.label)))
}
