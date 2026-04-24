/** @jsx jsx */
import { React, jsx } from 'jimu-core'
const { useEffect, useImperativeHandle, forwardRef, useState } = React

import type { ConsultaComponentHandle } from '../consulta-general-types'
import type { SelectOption } from '../types'
import { handleError, queryCapa } from '../util'
import SelectMunicipio from './SelectMunicipio'
import SelectAnio, { cargarAniosDesdeREST } from './SelectAnio'
import SelectDesdeArray from './SelectDesdeArray'

// ids de las respectivas capas en el servicio REST
const TEMATICA_MORTALIDAD = '8'
const TEMATICA_SUICIDIO = '7'

const ConsultaTematicas = forwardRef<ConsultaComponentHandle, any>(({
    loading,
    idMunicipio,
    setIdMunicipio,
    municipios,
    setMessage,
    arcgisService,
    execute,
    url
}, ref) => {
    const [tematicas, setTematicas] = useState<SelectOption[]>([])
    const [tematica, setTematica] = useState('')
    const [anios, setAnios] = useState<SelectOption[]>([])
    const [anio, setAnio] = useState('')
    const [rangosEdad, setRangosEdad] = useState<SelectOption[]>([])
    const [rangoEdad, setRangoEdad] = useState('')

    const construirDatosPieMortalidad = (features: any[]) => {
        const total = features.reduce((acumulado, feature) => {
            const numero = Number(feature?.attributes?.NUMERO ?? 0)
            return acumulado + (Number.isFinite(numero) ? numero : 0)
        }, 0)

        if (total <= 0) {
            return []
        }

        return features
            .map((feature: any) => {
                const causa = String(feature?.attributes?.CAUSA ?? '').trim()
                const numero = Number(feature?.attributes?.NUMERO ?? 0)

                if (!causa || !Number.isFinite(numero)) {
                    return null
                }

                return {
                    name: causa,
                    value: Number(((numero / total) * 100).toFixed(2))
                }
            })
            .filter(Boolean)
    }

    useImperativeHandle(ref, () => ({
        consultar: async () => {
            setMessage(`consultar de consulta tematicas ${anio}`)

            const layerId = tematica || TEMATICA_MORTALIDAD
            const whereParts: string[] = []

            if (anio) {
                whereParts.push(`ANIO='${anio}'`)
            }

            if (layerId === TEMATICA_MORTALIDAD && idMunicipio) {
                whereParts.push(`IDMUNICIPIO='${idMunicipio}'`)
            }

            if (layerId === TEMATICA_SUICIDIO && rangoEdad) {
                whereParts.push(`VALORDOMINIO='${rangoEdad}'`)
            }

            const response = await queryCapa(execute, arcgisService, url, layerId, {
                f: 'json',
                where: whereParts.length > 0 ? whereParts.join(' AND ') : '1=1',
                returnGeometry: true,
                outFields: '*'
            })

            if (handleError(response, setMessage) === -1) {
                return
            }

            const features = response.data?.features ?? []
            const fields = response.data?.fields ?? []

            return {
                features,
                fields,
                spatialReference: response.data?.spatialReference,
                withGraphic: layerId === TEMATICA_MORTALIDAD
                    ? {
                        showGraphic: true,
                        graphicData: construirDatosPieMortalidad(features),
                        graphicType: 'pie',
                        graphicTitle: `Causas de mortalidad, año ${anio || 'todos'}, municipio ${municipios.find(m => m.value === idMunicipio)?.label ?? 'todos'}`,
                        selectedIndicador: 0
                    }
                    : {
                        showGraphic: false,
                        graphicData: [],
                        graphicType: 'bar',
                        selectedIndicador: 0
                    }
            }
        },
        limpiar: () => {
            setIdMunicipio('')
            setTematica('')
            setAnio('')
            setRangoEdad('')
        }
    }), [tematica, anio, idMunicipio, municipios, rangoEdad])

    useEffect(() => {
        setTematicas([
            { value: TEMATICA_MORTALIDAD, label: 'Mortalidad' },
            { value: TEMATICA_SUICIDIO, label: 'Suicidio' }
        ].sort((a: any, b: any) => a.label.localeCompare(b.label)))
    }, [])

    useEffect(() => {
        const cargarRangoEdad = async () => {
            const response = await queryCapa(execute, arcgisService, url, TEMATICA_SUICIDIO, {
                f: 'json',
                where: '1=1',
                returnGeometry: false,
                outFields: 'EDAD, VALORDOMINIO',
                orderByFields: 'EDAD DESC'
            })

            if (handleError(response, setMessage) === -1) {
                return
            }

            const features = response.data?.features ?? []
            const uniquePairs = new Map<string, SelectOption>()
            const edadToValor = new Map<string, string>()
            const valorToEdad = new Map<string, string>()

            features.forEach((feature: any) => {
                const edad = String(feature.attributes?.EDAD ?? '').trim()
                const valorDominio = String(feature.attributes?.VALORDOMINIO ?? '').trim()

                if (!edad || !valorDominio) {
                    return
                }

                const valorRegistrado = edadToValor.get(edad)
                if (valorRegistrado && valorRegistrado !== valorDominio) {
                    throw new Error(`Dominio inconsistente para EDAD='${edad}': valores ${valorRegistrado} y ${valorDominio}`)
                }

                const edadRegistrada = valorToEdad.get(valorDominio)
                if (edadRegistrada && edadRegistrada !== edad) {
                    throw new Error(`Dominio inconsistente para VALORDOMINIO='${valorDominio}': edades ${edadRegistrada} y ${edad}`)
                }

                edadToValor.set(edad, valorDominio)
                valorToEdad.set(valorDominio, edad)
                uniquePairs.set(`${edad}::${valorDominio}`, {
                    value: valorDominio,
                    label: edad
                })
            })

            setRangosEdad(
                Array.from(uniquePairs.values())
                    .sort((a, b) => a.label.localeCompare(b.label))
            )
        }

        void cargarAniosDesdeREST(setAnios, execute, arcgisService, url, tematica, setMessage)

        if (tematica === TEMATICA_SUICIDIO) {
            void cargarRangoEdad()
        } else {
            setRangosEdad([])
            setRangoEdad('')
        }
    }, [tematica])

    return (
        <>
            <SelectDesdeArray label={'Temática'} valor={tematica} setValor={setTematica} array={tematicas} disabled={loading} />

            {tematica === TEMATICA_MORTALIDAD && (
                <SelectMunicipio disabled={loading} municipios={municipios} idMunicipio={idMunicipio} setIdMunicipio={setIdMunicipio} />
            )}

            {tematica === TEMATICA_SUICIDIO && (
                <SelectDesdeArray label={'Rango de edad'} valor={rangoEdad} setValor={setRangoEdad} array={rangosEdad} disabled={loading} />
            )}

            <SelectAnio loading={loading} anios={anios} anio={anio} setAnio={setAnio} />
        </>
    )
})

export default ConsultaTematicas
