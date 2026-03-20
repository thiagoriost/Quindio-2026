import { Loading } from 'jimu-ui'
import { React } from 'jimu-core'
import './style.css'

/* Componente de carga personalizado */
const OurLoading = () => {
  return (
    <div className='loading-overlay' role='status' aria-live='polite' aria-label='Cargando'>
      <div className='loading-panel'>
        <div className='loading-spinner-ring' aria-hidden='true' />
        <Loading />
        <p className='loading-text'>Cargando informacion del visor...</p>
      </div>
    </div>
  )
}

export default OurLoading
