/** @jsx jsx */

import { React, jsx } from 'jimu-core'
import { Select } from 'jimu-ui'
import { DatePicker } from 'jimu-ui/basic/date-picker'
import '../styles/consulta-ambiental.css'
import { DEFINICION_FILTROS } from '../config/filtros.config'

interface OptionItem {
    label: string
    value: string | number
}

interface Opciones {
    [key: string]: OptionItem[]
}

interface Props {
    filtros: any
    setFiltro: (campo: string, valor: any) => void
    opciones: Opciones
    handlers?: any
}

/**
 * Definición completa del formulario
const DEFINICION_FILTROS = [

  { campo: "area", label: "Área", tipo: "select", opciones: "areas" },

  { campo: "tematica", label: "Temática", tipo: "select", opciones: "tematicas", dependeDe: "area" },

  { campo: "categoria", label: "Categoría", tipo: "select", opciones: "categorias", dependeDe: "tematica", onChange: "cargarSubcategorias" },

  { campo: "subcategoria", label: "SubCategoría", tipo: "select", opciones: "subcategorias", dependeDe: "categoria" },

  { campo: "nombre", label: "Nombre", tipo: "select", opciones: "nombres", dependeDe: "subcategoria" },

  { campo: "anio", label: "Año", tipo: "select", opciones: "anios" },

  { campo: "municipio", label: "Municipio", tipo: "select", opciones: "municipios" },

  { campo: "fechaInicio", label: "Fecha inicio", tipo: "date" },

  { campo: "fechaFin", label: "Fecha fin", tipo: "date" }

]
 */

export const FiltrosClasificacion = ({
    filtros,
    setFiltro,
    opciones,
    handlers
}: Props) => {

    const renderOptions = (items: OptionItem[]) =>
        items?.map(op => (
            <option key={op.value} value={op.value}>
                {op.label}
            </option>
        ))

    const renderFiltro = (filtro: { campo: string; label: string; tipo: string; opciones: string; onChange: string; root: boolean; dependeDe?: undefined; casosEspeciales?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; onChange: string; casosEspeciales: { estaciones: string; "puntos de calidad": string }; root?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; onChange: string; condicion: (filters: any) => boolean; root?: undefined; casosEspeciales?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; onChange?: undefined; root?: undefined; dependeDe?: undefined; casosEspeciales?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; dependeDeCondicional: (filters: any) => "categoria" | "subcategoria"; onChange?: undefined; root?: undefined; casosEspeciales?: undefined; condicion?: undefined } | { campo: string; label: string; tipo: string; dependeDe: string; condicion: (filters: any) => boolean; opciones?: undefined; onChange?: undefined; root?: undefined; casosEspeciales?: undefined; dependeDeCondicional?: undefined }) => {

        // evaluar condición
        const cumpleCondicion = !filtro.condicion || filtro.condicion(filtros)

        // Resolver dependencia (normal o condicional)
        const dependeDe =
            filtro.dependeDeCondicional
                ? filtro.dependeDeCondicional(filtros)
                : filtro.dependeDe

        const valorDependencia = filtros[dependeDe]


        const disabled =
            !cumpleCondicion ||
            //            (!filtro.root && (!filtro.dependeDe || !filtros[filtro.dependeDe]))
            (!filtro.root && (!dependeDe || valorDependencia === undefined || valorDependencia === null))


        if (filtro.tipo === "select") {

            const opcionesFiltro = opciones[filtro.opciones] || []

            return (

                <Select
                    disabled={disabled}
                    value={filtros[filtro.campo] || ""}
                    onChange={(e) => {

                        const value = e.target.value

                        setFiltro(filtro.campo, value)

                        if (filtro.onChange && handlers?.[filtro.onChange]) {
                            //handlers[filtro.onChange](value, filtro, filtros) // cef 20260321
                            handlers[filtro.onChange](value, filtro, filtros, setFiltro)
                        }

                    }}
                >

                    <option value="">Seleccione</option>
                    {renderOptions(opcionesFiltro)}

                </Select>
            )

        }

        if (filtro.tipo === "date") {

            return (
                <DatePicker
                    runtime={true}
                    showDoneButton={true}
                    selectedDate={
                        filtros[filtro.campo]
                            ? new Date(filtros[filtro.campo] as number)
                            : null
                    }
                    onChange={(value) => {
                        let ts: number | null = null

                        if (!value) ts = null
                        else if (typeof value === "number") ts = value
                        else if ((value as any)?.toDate) ts = (value as any).toDate().getTime()
                        else if ((value as any)?.getTime) ts = (value as any).getTime()

                        setFiltro(filtro.campo, ts)
                    }}
                />
            )
        }
    }
    const isDisabledDatePicker = (filtro: { campo: string; label: string; tipo: string; opciones: string; onChange: string; root: boolean; dependeDe?: undefined; casosEspeciales?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; onChange: string; casosEspeciales: { estaciones: string; "puntos de calidad": string }; root?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; onChange: string; condicion: (filters: any) => boolean; root?: undefined; casosEspeciales?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; onChange?: undefined; root?: undefined; dependeDe?: undefined; casosEspeciales?: undefined; condicion?: undefined; dependeDeCondicional?: undefined } | { campo: string; label: string; tipo: string; opciones: string; dependeDe: string; dependeDeCondicional: (filters: any) => "categoria" | "subcategoria"; onChange?: undefined; root?: undefined; casosEspeciales?: undefined; condicion?: undefined } | { campo: string; label: string; tipo: string; dependeDe: string; condicion: (filters: any) => boolean; opciones?: undefined; onChange?: undefined; root?: undefined; casosEspeciales?: undefined; dependeDeCondicional?: undefined }) => {
        const { campo } = filtro
//        console.log('filtros>>>', filtros)

        if (campo === "fechaInicio" || campo === "fechaFin") {
            return (filtros.categoria !== 3)
        }
    }
    return (
        <div className="consulta-ambiental-form">

            {DEFINICION_FILTROS.map(filtro => {

                const ocultar = isDisabledDatePicker(filtro)

                if (ocultar) return null

                return (
                    <div className="filtro-row" key={filtro.campo}>
                        <label>{filtro.label}</label>
                        {renderFiltro(filtro)}
                    </div>
                )
            })}

        </div>
    )

}
