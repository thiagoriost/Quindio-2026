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

const normalizarCampoNumerico = (features: any[], field: string) => {
    return (features ?? []).map((feature: any) => {
        const valor = Number(feature?.attributes?.[field])

        if (!Number.isFinite(valor)) {
            return feature
        }

        return {
            ...feature,
            attributes: {
                ...feature.attributes,
                [field]: valor
            }
        }
    })
}

const normalizarTipoCampo = (fields: any[], fieldName: string, fieldType: string) => {
    return (fields ?? []).map((field: any) => (
        field?.name === fieldName
            ? { ...field, type: fieldType }
            : field
    ))
}

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

const construirLeyendaCoropletica = (
    features: any[],
    field: string,
    labelRango: string,
    rangosFijos?: Array<{ minimo: number; maximo: number; label: string }>
) => {
    const valores = (features ?? [])
        .map((feature: any) => Number(feature?.attributes?.[field]))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)

    if (!valores.length) {
        return []
    }

    const paleta = {
        bajo: { colorFondo: '108,142,191,0.7', colorLine: '108,142,191,1' },
        medio: { colorFondo: '0,162,39,0.7', colorLine: '0,162,39,1' },
        medioAlto: { colorFondo: '201,162,39,0.7', colorLine: '201,162,39,1' },
        alto: { colorFondo: '166,61,64,0.7', colorLine: '166,61,64,1' }        
    }

    const obtenerColorRango = (index: number, total: number) => {
        if (total <= 1) {
            return paleta.medio
        }

        if (index === 0) {
            return paleta.bajo
        }

        if (index === total - 1) {
            return paleta.alto
        }

        if (total >= 4 && index === total - 2) {
            return paleta.medioAlto
        }

        return paleta.medio
    }

    if (rangosFijos?.length) {
        return rangosFijos.map((rango, index) => ({
            ...rango,
            colorFondo: obtenerColorRango(index, rangosFijos.length).colorFondo,
            colorLine: obtenerColorRango(index, rangosFijos.length).colorLine
        }))
    }

    const minimo = valores[0]
    const maximo = valores[valores.length - 1]

    if (minimo === maximo) {
        return [{
            minimo,
            maximo,
            label: `${labelRango} ${minimo.toLocaleString('es-CO')}`,
            colorFondo: paleta.medio.colorFondo,
            colorLine: paleta.medio.colorLine
        }]
    }

    const totalRangos = Math.min(4, valores.length)

    return Array.from({ length: totalRangos }, (_, index) => {
        const startIndex = Math.floor((index * valores.length) / totalRangos)
        const endIndex = Math.floor((((index + 1) * valores.length) / totalRangos) - 1)
        const rangoMin = valores[startIndex]
        const rangoMax = valores[Math.max(startIndex, endIndex)]

        return {
            minimo: rangoMin,
            maximo: rangoMax,
            label: `${labelRango} ${rangoMin.toLocaleString('es-CO')} - ${rangoMax.toLocaleString('es-CO')}`,
            colorFondo: obtenerColorRango(index, totalRangos).colorFondo,
            colorLine: obtenerColorRango(index, totalRangos).colorLine
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

const construirRangosTerciles = (features: any[], field: string) => {
    const valores = (features ?? [])
        .map((feature: any) => Number(feature?.attributes?.[field]))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)

    if (!valores.length) {
        return undefined
    }

    const minimo = valores[0]
    const maximo = valores[valores.length - 1]

    if (minimo === maximo) {
        return [{ minimo, maximo, label: `Bajo/Medio/Alto: ${minimo.toLocaleString('es-CO')}` }]
    }

    const tercio = (maximo - minimo) / 3
    const maximoBajo = Math.floor(minimo + tercio)
    const maximoMedio = Math.floor(minimo + (tercio * 2))
    const rangos = [
        { minimo, maximo: maximoBajo, label: `Bajo: ${minimo.toLocaleString('es-CO')} a ${maximoBajo.toLocaleString('es-CO')}` },
        { minimo: maximoBajo + 1, maximo: maximoMedio, label: `Medio: ${(maximoBajo + 1).toLocaleString('es-CO')} a ${maximoMedio.toLocaleString('es-CO')}` },
        { minimo: maximoMedio + 1, maximo, label: `Alto: ${(maximoMedio + 1).toLocaleString('es-CO')} a ${maximo.toLocaleString('es-CO')}` }
    ]

    return rangos.filter((rango) => rango.minimo <= rango.maximo)
}

const construirRangosPorcentuales = (features: any[], field: string) => {
    const valores = (features ?? [])
        .map((feature: any) => Number(feature?.attributes?.[field]))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)

    if (!valores.length) {
        return undefined
    }

    const maximo = valores[valores.length - 1]
    const limite10 = maximo * 0.1
    const limite50 = maximo * 0.5
    const limite75 = maximo * 0.75

    return [
        { minimo: Number.NEGATIVE_INFINITY, maximo: limite10, label: `Menor a 10% (hasta ${limite10.toLocaleString('es-CO', { maximumFractionDigits: 2 })})` },
        { minimo: limite10, maximo: limite50, label: `10% a 50% (${limite10.toLocaleString('es-CO', { maximumFractionDigits: 2 })} a ${limite50.toLocaleString('es-CO', { maximumFractionDigits: 2 })})` },
        { minimo: limite50, maximo: limite75, label: `50% a 75% (${limite50.toLocaleString('es-CO', { maximumFractionDigits: 2 })} a ${limite75.toLocaleString('es-CO', { maximumFractionDigits: 2 })})` },
        { minimo: limite75, maximo: Number.MAX_SAFE_INTEGER, label: `Mayor a 75% (desde ${limite75.toLocaleString('es-CO', { maximumFractionDigits: 2 })})` }
    ]
}

const ConsultaIndicadores = forwardRef((
{
    loading,
    setLoading,
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
            setLoading(true)

            try {
            const whereParts: string[] = []

            if (anio) {
                whereParts.push(`ANIO=${anio}`)
            }

            if (idCategoria && (indicador === INDICADOR_AFILIACIONES || indicador === INDICADORES_MORBILIDAD))
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
            let features = asignarSpatialReferenceAGeometrias(
                response.data?.features ?? [],
                spatialReference
            )
            let fields = response.data?.fields ?? []

            if (indicador === INDICADORES_MORBILIDAD) {
                features = normalizarCampoNumerico(features, MORBILIDAD_FIELD)
                fields = normalizarTipoCampo(fields, MORBILIDAD_FIELD, 'esriFieldTypeInteger')
            }
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
            const coroplethLabel = (() => {
                if (indicador === INDICADOR_AFILIACIONES) {
                    return 'Cobertura total'
                } else if (indicador === COBERTURA_VACUNACION) {
                    return 'Porcentaje'
                } else if (indicador === VIOLENCIA_INTRAFAMILIAR) {
                    return 'Tasa por 10.000 habitantes'
                } else if (indicador === INDICADORES_MORBILIDAD) {
                    return 'Número de casos'
                } else if (indicador === INDICADORES_MORTALIDAD || indicador === INDICADORES_NATALIDAD) {
                    return categoriaAfiliacion
                }

                return ''
            })()
            const rangosFijosAfiliaciones = indicador === INDICADOR_AFILIACIONES
                ? [
                    { minimo: 0, maximo: 5000, label: '0 a 5.000' },
                    { minimo: 5001, maximo: 20000, label: '5.001 a 20.000' },
                    { minimo: 20001, maximo: 80000, label: '20.001 a 80.000' },
                    { minimo: 80001, maximo: Number.MAX_SAFE_INTEGER, label: '80.001 o más' }
                ]
                : undefined
            const rangosFijosPorcentaje = indicador === COBERTURA_VACUNACION || indicador === VIOLENCIA_INTRAFAMILIAR
                ? [
                    { minimo: 0, maximo: 33, label: 'Bajo: 0 a 33%' },
                    { minimo: 34, maximo: 65, label: 'Medio: 34% a 65%' },
                    { minimo: 66, maximo: Number.MAX_SAFE_INTEGER, label: 'Alto: 66% o más' }
                ]
                : undefined
            const rangosMorbilidad = indicador === INDICADORES_MORBILIDAD
                ? construirRangosTerciles(features, MORBILIDAD_FIELD)
                : undefined
            const rangosMortalidad = indicador === INDICADORES_MORTALIDAD && idCategoria
                ? construirRangosTerciles(features, idCategoria)
                : undefined
            const rangosNatalidad = indicador === INDICADORES_NATALIDAD && idCategoria
                ? construirRangosPorcentuales(features, idCategoria)
                : undefined
            const leyendaCoropletica = coroplethField
                ? construirLeyendaCoropletica(features, coroplethField, coroplethLabel, rangosFijosAfiliaciones ?? rangosFijosPorcentaje ?? rangosMorbilidad ?? rangosMortalidad ?? rangosNatalidad)
                : []
            ;

            let datosGrafico = null;
            //let featuresEnvio = null;
            let fieldsEnvio = null;
            
            if ( indicador === INDICADOR_AFILIACIONES ) {
                datosGrafico = construirDatosGrafico(features, AFILIACIONES_FIELD);                
                fieldsEnvio = [{ name: 'NOMBRE', alias: 'Municipio' }, { name: "COBERTURATOTAL", alias: 'Cobertura total' }]
            } else {                
                fieldsEnvio=fields;
            }

            console.log("leyendaCoropletica", leyendaCoropletica);

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
            } finally {
                setLoading(false)
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
