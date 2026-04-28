import { React } from 'jimu-core'
import './DetalleLabelValueFoto.css'
const { useEffect, useState } = React

type DetalleLabelValueItem = {
    label: string
    value: React.ReactNode
}

interface DetalleLabelValueFotoProps {
    title: React.ReactNode
    items: DetalleLabelValueItem[]
    imageUrl?: string | null
    imageAlt?: string
    onVolver?: () => void
    backLabel?: string
}

const DetalleLabelValueFoto = ({
    title,
    items,
    imageUrl,
    imageAlt = 'Imagen del detalle',
    onVolver,
    backLabel = 'Parámetros'
}: DetalleLabelValueFotoProps) => {
    const [imageLoaded, setImageLoaded] = useState(false)

    useEffect(() => {
        setImageLoaded(false)
    }, [imageUrl])    

    return (
        <div className="detalle-label-value-foto detalle-establecimiento">
        <h3 className="detalle-titulo">{title}</h3>

        {(imageUrl && imageUrl.trim() !== '') && (
            <div className="detalle-label-value-foto__media">
                <div className="establecimiento-img-container">
                {!imageLoaded && <div className="establecimiento-img-skeleton" aria-hidden="true" />}
                <img
                src={imageUrl}
                alt={imageAlt}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                style={{ opacity: imageLoaded ? 1 : 0 }}
                />
                </div>
            </div>
        )}

        <div className="detalle-label-value-foto__content">
            <div className="detalle-campos">
                {items.map((item, index) => (
                <div className="detalle-campo" key={`${item.label}-${index}`}>
                    <span className="detalle-label">{item.label}</span>
                    <span className="detalle-value">{item.value || "No disponible"}</span>
                </div>
                ))}

                {onVolver && (
                <button className="detalle-btn-volver" onClick={onVolver}>{backLabel}</button>
                )}
            </div>
        </div>
        </div>
    )
}

export default DetalleLabelValueFoto
export type { DetalleLabelValueItem, DetalleLabelValueFotoProps }