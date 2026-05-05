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
    seccion1Titulo,
    seccion1Items,
    seccion2Titulo,
    seccion2Items, 
    seccion3Titulo,
    seccion3Items, 
    imageUrl,
    imageAlt = 'Imagen del detalle',
    onVolver,
    backLabel = 'Parámetros'
}) => {
    const [imageLoaded, setImageLoaded] = useState(false)

    useEffect(() => {
        setImageLoaded(false)
    }, [imageUrl])    

    return (
        <div className="dlvf-contenedor">
            <div className='dlvf-titulo-principal'>{title}</div>

            {(imageUrl && imageUrl.trim() !== '') && (               
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
            )}

            { seccion1Items && seccion1Items.length > 0 &&(
            <>
            <div className='dlvf-titulo-secundario'>{seccion1Titulo}</div>
            <table>                
                {seccion1Items.map((item, index) => (
                <tr key={`${item.label}-${index}`}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.value || "No disponible"}</td>
                </tr>
                ))}
            </table>
            </>
            )}

            { seccion2Items && seccion2Items.length > 0 &&(
            <>
            <div className='dlvf-titulo-secundario'>{seccion2Titulo}</div>
            <table>                
                {seccion2Items.map((item, index) => (
                <tr key={`${item.label}-${index}`}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.value || "No disponible"}</td>
                </tr>
                ))}
            </table>
            </>
            )  }

            { seccion3Items && seccion3Items.length > 0 &&(
            <>
            <div className='dlvf-titulo-secundario'>{seccion3Titulo}</div>
            <table>                
                {seccion3Items.map((item, index) => (
                <tr key={`sec3-${index}`}>                    
                    <td>{item.value}</td>
                </tr>
                ))}
            </table>

            <div style={{background: "#F0F0F0"}}>
                {seccion3Items.map(item => item.value).join(', ')}
            </div>
            </>
            )  }
                    
            <button className="detalle-btn-volver" onClick={onVolver}>{backLabel}</button>            
        </div>
    )
}

export default DetalleLabelValueFoto
export type { DetalleLabelValueItem, DetalleLabelValueFotoProps }