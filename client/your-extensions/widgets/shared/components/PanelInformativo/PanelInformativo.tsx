import { React } from 'jimu-core'
import { Button } from 'jimu-ui'
import './PanelInformativo.css'
import telefonoIcon from './assets/phone-solid-full.svg'
import atIcon from './assets/at-solid-full.svg'
import mapIcon from './assets/map-solid-full.svg'
import clockIcon from './assets/clock-solid-full.svg'
import envelopeIcon from './assets/envelope-solid-full.svg'
import { capitalizarPalabras } from '../../utils/text-utils'

const { useEffect, useState } = React

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
    botonOnClick,
    botonLabel = 'Parámetros'
}) {
    const [imagenCargada, setImagenCargada] = useState("cargando");

    return (
        <div className='panel-informativo'>
            <div className='panel-informativo-imagen-contenedor'>               
                { (imagenUrl && imagenUrl.trim() !== '') && (imagenCargada != "error") && (
                <img
                src={imagenUrl}   
                className='panel-informativo-imagen-imagen'                 
                style={{ display: imagenCargada === "ok" ? "block" : "none" }}
                onLoad={() => setImagenCargada("ok")}
                onError={() => setImagenCargada("error")}
                />
                )}

                <div className='panel-informativo-imagen-texto'>
                    { titulo.toUpperCase() }
                </div>
            </div>

            <div>
                <div className='panel-informativo-seccion-titulo'>
                    {listaIconoTextoTitulo.toUpperCase()}
                </div>
                
                <div className='panel-informativo-icono-texto-contenedor'>
                    {
                    listaIconoTextoItems.map( (e, i)=>
                    <>
                        <div>
                            <img src={e.iconoSrc} alt={e.iconoAlt} className='panel-informativo-icono-texto-imagen' />
                        </div>
                        <div className='panel-informativo-icono-texto-contenedor-texto'>
                            <div className='panel-informativo-icono-texto-texto'>{capitalizarPalabras(e.texto)}</div>
                            <div className='panel-informativo-icono-texto-valor'>{e.valor || 'No disponible'}</div>
                        </div>
                    </>}
                </div>
            </div>

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
                            <img
                            src={chipsIconoTextoIcono}
                            alt=""
                            className='panel-informativo-chip-imagen' />
                            <span>{item.value} {capitalizarPalabras(item.label)}</span>
                        </div>
                    ))}
                </div>
            </div>
            )}

            { chipsTextoItems && chipsTextoItems.length > 0 && (
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
        </div>
    )
}

export function itemsInformacionContacto({
    telefono,
    direccion,
    horario,
    sitioWeb,
    email
}) {
    return [
        {iconoSrc: telefonoIcon, iconoAlt:"Teléfono", texto:"Teléfono", valor:telefono},
        {iconoSrc: mapIcon, iconoAlt:"Dirección", texto:"Dirección", valor:direccion},
        {iconoSrc: clockIcon, iconoAlt:"Horario", texto:"Horario", valor:horario},
        {iconoSrc: atIcon, iconoAlt:"Sitio web", texto:"Sitio web", valor:sitioWeb},
        {iconoSrc: envelopeIcon, iconoAlt:"Correo electrónico", texto:"Correo electrónico", valor:email}
    ]
}