import { React } from 'jimu-core'
import { Button } from 'jimu-ui'

// @ts-expect-error - Ignorar error de importación de imágenes
import './PanelInformativo.css'
import telefonoIcon from './assets/phone-solid-full.svg'
import atIcon from './assets/at-solid-full.svg'
import mapIcon from './assets/map-solid-full.svg'
import clockIcon from './assets/clock-solid-full.svg'
import envelopeIcon from './assets/envelope-solid-full.svg'
import nitIcon from './assets/nit-solid-full.svg'
import registroMercantilIcon from './assets/registro-mercantil-solid-full.svg'
import rntIcon from './assets/rnt-solid-full.svg'
import ciiuIcon from './assets/ciiu-solid-full.svg'
import { capitalizarPalabras } from '../../utils/text-utils'
import { validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
import { useEffect } from 'react'

const { /* useMemo, */ useState } = React

export interface IconoTextoItem {
    iconoSrc: string
    iconoAlt: string
    texto: string
    valor?: string | number | null
}

export interface ChipItem {
    label?: string
    value?: string | number | null
}

export interface InformacionAdicionalItem {
    label: string
    value: string
}

interface InformacionContactoInput {
    telefono?: string | number | null
    direccion?: string | number | null
    horario?: string | number | null
    sitioWeb?: string | number | null
    email?: string | number | null
    nit?: string | number | null
    registroMercantil?: string | number | null
    rnt?: string | number | null
    ciiu?: string | number | null
}

interface PanelInformativoProps {
    titulo: string
    imagenUrl: string
    listaIconoTextoTitulo?: string
    listaIconoTextoItems: IconoTextoItem[]
    chipsIconoTextoTitulo?: string
    chipsIconoTextoItems?: ChipItem[]
    chipsIconoTextoIcono?: string
    chipsTextoTitulo?: string
    chipsTextoItems?: ChipItem[]
    informacionAdicionalTitulo?: string
    informacionAdicionalItems?: InformacionAdicionalItem[]
    botonOnClick: () => void
    botonLabel?: string
}

/**
 * Renderiza un panel informativo reutilizable con imagen, contacto, chips y campos adicionales.
 * @param props - Propiedades del panel informativo.
 * @returns Componente visual de detalle.
 */
export default function PanelInformativo({
    titulo,
    imagenUrl,
    listaIconoTextoTitulo="información de contacto",
    listaIconoTextoItems,
    chipsIconoTextoTitulo,
    chipsIconoTextoItems,
    chipsIconoTextoIcono,
    chipsTextoTitulo,
    chipsTextoItems,
    informacionAdicionalTitulo = 'información adicional',
    informacionAdicionalItems,
    botonOnClick,
    botonLabel = 'Parámetros'
}: PanelInformativoProps) {
    if (validaLoggerLocalStorage('logger')) {
        console.log({
            titulo,
            imagenUrl,
            listaIconoTextoTitulo,
            listaIconoTextoItems,
            chipsIconoTextoTitulo,
            chipsIconoTextoItems,
            chipsIconoTextoIcono,
            chipsTextoTitulo,
            chipsTextoItems,
            informacionAdicionalTitulo,
            informacionAdicionalItems,
            botonLabel
        })
    }
    /** Estado que rastrea si la imagen está cargada ('cargando' | 'ok' | 'error'). */
    const [imagenCargada, setImagenCargada] = useState('cargando')
    /** Estado que controla si la imagen está expandida a pantalla completa. */
    const [imagenExpandida, setImagenExpandida] = useState(false)

    /**
     * Filtra los campos adicionales para mostrar solo pares etiqueta/valor con contenido.
     */
    /* const informacionAdicionalVisible = useMemo(() => {
        return (informacionAdicionalItems ?? []).filter(item => {
            return Boolean(item?.label?.trim()) && Boolean(item?.value?.trim())
        })
    }, [informacionAdicionalItems]) */

    /**
     * Alterna el estado de expansión de la imagen entre pantalla completa y tamaño original.
     * @remarks Al expandir, oculta toda la información adicional. Al contraer, restaura el diseño original.
     */
    const handleImagenToggle = () => {
        console.log('toggle imagen expandida', !imagenExpandida, imagenUrl)
        if ((imagenUrl && imagenUrl.trim() !== '')) {
            setImagenExpandida(!imagenExpandida)
        }
    }

    /**
     * Marca la imagen como cargada exitosamente para mostrarla en el panel.
     */
    const handleImagenLoad = () => {
        setImagenCargada('ok')
    }

    /**
     * Marca la imagen como fallida para ocultarla cuando no se pueda cargar.
     */
    const handleImagenError = () => {
        setImagenCargada('error')
    }

    useEffect(() => {

    console.log(
        {
            imagenCargada,
            imagenExpandida,
            titulo,
            imagenUrl,
            listaIconoTextoTitulo,
            listaIconoTextoItems,
            chipsIconoTextoTitulo,
            chipsIconoTextoItems,
            chipsIconoTextoIcono,
            chipsTextoTitulo,
            chipsTextoItems,
            informacionAdicionalTitulo,
            informacionAdicionalItems,
            botonLabel
        }
    )

    }, [imagenCargada, imagenExpandida, titulo, imagenUrl, listaIconoTextoTitulo, listaIconoTextoItems, chipsIconoTextoTitulo, chipsIconoTextoItems, chipsIconoTextoIcono, chipsTextoTitulo, chipsTextoItems, informacionAdicionalTitulo, informacionAdicionalItems, botonLabel])


    return (
        <div className='panel-informativo'>
            <div
                className='panel-informativo-imagen-contenedor'
                style={{
                    width: imagenExpandida ? '100%' : 'auto',
                    height: imagenExpandida ? '100%' : 'auto'
                }}
                onClick={handleImagenToggle}
            >
                {
                    (imagenUrl && imagenUrl.trim() !== '') && (imagenCargada !== 'error') && (
                        <img
                            src={imagenUrl}
                            className='panel-informativo-imagen-imagen'
                            style={{
                                display: imagenCargada === 'ok' ? 'block' : 'none',
                                cursor: 'pointer'
                            }}
                            onLoad={handleImagenLoad}
                            onError={handleImagenError}

                        />
                    )
                }

                {!imagenExpandida && (
                    <div className='panel-informativo-imagen-texto'>
                        { titulo ? titulo.toUpperCase() : '' }
                    </div>
                )}
            </div>

            {!imagenExpandida && (
                <>
                    <div>
                        <div className='panel-informativo-seccion-titulo'>
                            {listaIconoTextoTitulo.toUpperCase()}
                        </div>

                        <div className='panel-informativo-icono-texto-contenedor'>
                            {
                                listaIconoTextoItems.find(e => e.valor !== "" && e.valor !== undefined)
                                ? listaIconoTextoItems.map((e, i) =>
                                    <React.Fragment key={`${e.texto}-${e.iconoAlt}-${i}`}>
                                        {
                                            (e.valor !== "" && e.valor !== undefined) && (
                                                <>
                                                    <div>
                                                        <img src={e.iconoSrc} alt={e.iconoAlt} className='panel-informativo-icono-texto-imagen' />
                                                    </div>
                                                    <div className='panel-informativo-icono-texto-contenedor-texto'>
                                                        <div className='panel-informativo-icono-texto-texto'>{capitalizarPalabras(e.texto)}</div>
                                                        <div className='panel-informativo-icono-texto-valor'>{e.valor || 'No disponible'}</div>
                                                    </div>
                                                </>
                                            )
                                        }
                                    </React.Fragment>)
                                : <div style={{width:'max-content'}}>Sin información disponible</div>
                            }
                        </div>
                    </div>

                    {/* {informacionAdicionalVisible.length > 0 && (
                    <div>
                        <div className='panel-informativo-seccion-titulo'>
                            {informacionAdicionalTitulo.toUpperCase()}
                        </div>

                        <div className='panel-informativo-campos-contenedor'>
                            {informacionAdicionalVisible.map((item, index) => (
                                <div
                                key={`${item.label}-${index}`}
                                className='panel-informativo-campo'>
                                    <span className='panel-informativo-campo-label'>{item.label}</span>
                                    <span className='panel-informativo-campo-value'>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )} */}

                    { chipsIconoTextoItems && chipsIconoTextoItems.length > 0 && (
                    <div>
                        <div className='panel-informativo-seccion-titulo'>
                            {chipsIconoTextoTitulo.toUpperCase()} ({chipsIconoTextoItems.length})
                        </div>

                        <div className='panel-informativo-chip-contenedor'>
                            {chipsIconoTextoItems?.map((item, index) => (
                                <div
                                key={`${item?.label || item?.value || 'capacidad'}-${index}`}
                                className='panel-informativo-chip'>
                                    {
                                        chipsIconoTextoIcono ? (
                                            <img
                                            src={chipsIconoTextoIcono}
                                            alt=""
                                            className='panel-informativo-chip-imagen' />
                                        ) : null
                                    }
                                    <span>{item.value} {capitalizarPalabras(item.label)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    { chipsTextoItems.find(e => e.value !== "" && e.value !== undefined && e.value !== '0') && (
                    <div>
                        <div className='panel-informativo-seccion-titulo'>
                            {chipsTextoTitulo.toUpperCase()} ({chipsTextoItems.length})
                        </div>

                        <div className='panel-informativo-chip-contenedor'>
                            {chipsTextoItems?.map((item, index) => (
                                <div
                                key={`${item?.label || item?.value || 'capacidad'}-${index}`}
                                className="panel-informativo-chip">
                                    <span>{item.value} {item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    <Button type="primary" className="panel-informativo-boton" onClick={botonOnClick}>{botonLabel}</Button>
                </>
            )}
        </div>
    )
}

/**
 * Construye la lista de items de contacto para el panel informativo.
 * @param params - Valores de contacto obtenidos del servicio.
 * @returns Arreglo tipado de items con icono y texto.
 */
export function itemsInformacionContacto({
    telefono,
    direccion,
    horario,
    sitioWeb,
    email,
    nit,
    registroMercantil,
    rnt,
    ciiu
}: InformacionContactoInput): IconoTextoItem[] {
    return [
        { iconoSrc: telefonoIcon, iconoAlt: 'Teléfono', texto: 'Teléfono', valor: telefono },
        { iconoSrc: mapIcon, iconoAlt: 'Dirección', texto: 'Dirección', valor: direccion },
        { iconoSrc: clockIcon, iconoAlt: 'Horario', texto: 'Horario', valor: horario },
        { iconoSrc: atIcon, iconoAlt: 'Sitio web', texto: 'Sitio web', valor: sitioWeb },
        { iconoSrc: envelopeIcon, iconoAlt: 'Correo electrónico', texto: 'Correo electrónico', valor: email },
        { iconoSrc: nitIcon, iconoAlt: 'NIT', texto: 'NIT', valor: nit },
        { iconoSrc: registroMercantilIcon, iconoAlt: 'Registro mercantil', texto: 'Registro mercantil', valor: registroMercantil },
        { iconoSrc: rntIcon, iconoAlt: 'RNT', texto: 'RNT', valor: rnt },
        { iconoSrc: ciiuIcon, iconoAlt: 'CIIU', texto: 'CIIU', valor: ciiu }
    ]
}