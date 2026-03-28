/** @jsx jsx */

import { React, jsx } from 'jimu-core'
import { Select } from 'jimu-ui'
import '../styles/consulta-ambiental.css'

interface OptionItem {
    label: string
    value: string | number
}

interface OpcionesClasificacion {
    areas: OptionItem[]
    tematicas: OptionItem[]
    categorias: OptionItem[]
}

interface Props {
    filtros: any
    setFiltro: (campo: string, valor: any) => void
    opciones: OpcionesClasificacion
    handlers?: any
}

/**
 * Definición de los filtros de clasificación
 */
const DEFINICION_FILTROS = [
    {
        campo: "area",
        label: "Área",
        opciones: "areas"
    },
    {
        campo: "tematica",
        label: "Temática",
        opciones: "tematicas",
        dependeDe: "area"
    },
    {
        campo: "categoria",
        label: "Categoría",
        opciones: "categorias",
        dependeDe: "tematica",
        onChange: "cargarSubcategorias"
    },
    {
        campo: "subcategoria",
        label: "SubCategoría",
        opciones: "subcategorias",
        dependeDe: "categoria"
    },
    {
        campo: "nombre",
        label: "Nombre",
        opciones: "nombres",
        dependeDe: "subcategoria"
    },
    /*
    {
        campo: "anio",
        label: "Año",
        opciones: "", // por definir
        dependeDe: "subcategoria"
    },
    {
        campo: "municipio",
        label: "Municipio",
        opciones: "", // viene de servicio
        dependeDe: "subcategoria"
    },
*/
]

export const FiltrosClasificacion = ({
    filtros,
    setFiltro,
    opciones,
    handlers
}: Props) => {

    return (

        <div className="consulta-ambiental-form">

            {DEFINICION_FILTROS.map(filtro => {

                const disabled = filtro.dependeDe
                    ? !filtros[filtro.dependeDe]
                    : false

                const opcionesFiltro = opciones[filtro.opciones] || []

                return (

                    <div className="filtro-row" key={filtro.campo}>

                        <label>{filtro.label}</label>

                        <Select
                            disabled={disabled}
                            value={filtros[filtro.campo] || ""}
                            onChange={(e) => {

                                const value = e.target.value

                                setFiltro(filtro.campo, value)

                                if (filtro.onChange && handlers?.[filtro.onChange]) {
                                    handlers[filtro.onChange](value)
                                }

                            }}
                        >

                            <option value="">Seleccione</option>

                            {opcionesFiltro.map(op => (
                                <option key={op.value} value={op.value}>
                                    {op.label}
                                </option>
                            ))}

                        </Select>

                    </div>

                )

            })}

        </div>

    )
}