import { React } from "jimu-core"

interface DetalleEstablecimientoProps {
  cloneFeatures: any[]
  selectedEstablecimiento: {
    NOMBREESTABLECIMIENTO: string
    DIRECCION: string
    JORNADA: string
    IDZONA: string
    IDSECTOR: string
    IDTIPOSEDE: string
    IDGRUPO: string

  } | null
  onVolver: () => void
}

const DetalleEstablecimiento = ({ cloneFeatures, selectedEstablecimiento, onVolver }: DetalleEstablecimientoProps) => {
  return (
    <div className="detalle-establecimiento">
      {cloneFeatures?.[0]?.attributes?.IMAGEN && cloneFeatures[0].attributes.IMAGEN !== " " && (
        <div className="establecimiento-img-container">
          <img src={cloneFeatures[0].attributes.IMAGEN} alt="Imagen del establecimiento" />
        </div>
      )}

        <h3 className="detalle-titulo">{selectedEstablecimiento?.NOMBREESTABLECIMIENTO}</h3>

        <div className="detalle-campos">
            {(cloneFeatures?.[0]?.attributes?.NOMBRE || cloneFeatures?.[0]?.attributes?.PRIMERAPELLIDO || cloneFeatures?.[0]?.attributes?.SEGUNDOAPELLIDO) && (
            <div className="detalle-campo">
                <span className="detalle-label">Contacto</span>
                <span className="detalle-value">{`${cloneFeatures?.[0]?.attributes?.NOMBRE || ''} ${cloneFeatures?.[0]?.attributes?.PRIMERAPELLIDO || ''} ${cloneFeatures?.[0]?.attributes?.SEGUNDOAPELLIDO || ''}`.trim()}</span>
            </div>
            )}

            {cloneFeatures?.[0]?.attributes?.DIRECCION && (
            <div className="detalle-campo">
                <span className="detalle-label">Dirección</span>
                <span className="detalle-value">{selectedEstablecimiento?.DIRECCION}</span>
            </div>
            )}

            {selectedEstablecimiento?.JORNADA && (
            <div className="detalle-campo">
                <span className="detalle-label">Jornada</span>
                <span className="detalle-value">{selectedEstablecimiento.JORNADA}</span>
            </div>
            )}
            {selectedEstablecimiento?.IDZONA && (
            <div className="detalle-campo">
                <span className="detalle-label">Zona</span>
                <span className="detalle-value">{selectedEstablecimiento.IDZONA}</span>
            </div>
            )}
            {selectedEstablecimiento?.IDSECTOR && (
            <div className="detalle-campo">
                <span className="detalle-label">Sector</span>
                <span className="detalle-value">{selectedEstablecimiento.IDSECTOR}</span>
            </div>
            )}
            {selectedEstablecimiento?.IDTIPOSEDE && (
            <div className="detalle-campo">
                <span className="detalle-label">Tipo de Sede</span>
                <span className="detalle-value">{selectedEstablecimiento.IDTIPOSEDE}</span>
            </div>
            )}
            {selectedEstablecimiento?.IDGRUPO && (
            <div className="detalle-campo">
                <span className="detalle-label">Grupo</span>
                <span className="detalle-value">{selectedEstablecimiento.IDGRUPO}</span>
            </div>
            )}

            <button className="detalle-btn-volver" onClick={onVolver}>Parámetros</button>
        </div>
    </div>
  )
}

export default DetalleEstablecimiento
