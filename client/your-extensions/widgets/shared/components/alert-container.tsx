/** @jsx jsx */
import { Alert } from 'jimu-ui'
import { useEffect, useState } from 'react'
import { alertService, AlertMessage } from '../../shared/services/alert.service'

/**
 * AlertContainer
 * ---------------------------------------------------------------------------
 * Componente contenedor responsable de renderizar las alertas globales
 * de la aplicación.
 *
 * Se suscribe al {@link alertService} para escuchar cambios en la lista
 * de alertas activas y las muestra utilizando el componente {@link Alert}
 * de jimu-ui.
 *
 * Características:
 * - Posicionamiento fijo (esquina superior derecha).
 * - Múltiples alertas en columna.
 * - Permite cerrar cada alerta individualmente.
 * - Limpia automáticamente la suscripción al desmontarse.
 *
 * Este componente debe declararse una sola vez en un nivel alto
 * de la aplicación (por ejemplo en App.tsx o layout principal).
 *
 * @component
 * @returns {JSX.Element} Contenedor visual con la lista de alertas activas.
 */
export const AlertContainer = () => {
  /**
   * Estado local que contiene la lista de alertas activas.
   */
  const [alerts, setAlerts] = useState<AlertMessage[]>([])

  /**
   * Hook ejecutado una sola vez al montar el componente.
   * Útil para depuración o inicialización futura.
   */
  useEffect(() => {
    console.log('AlertContainer montado')
  }, [])

  /**
   * Se suscribe al alertService para recibir actualizaciones
   * cuando se agregan o eliminan alertas.
   *
   * Al desmontar el componente:
   * - Se elimina la suscripción para evitar memory leaks.
   */
  useEffect(() => {
     /**
     * Listener que recibe la lista actualizada de alertas.
     *
     * @param {AlertMessage[]} a - Lista actual de alertas activas.
     */
    const listener = (a: AlertMessage[]) => {
      setAlerts([...a])
    }

    alertService.subscribe(listener)

    return () => {
      alertService.unsubscribe(listener)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 200000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          open
          closable
          withIcon
          variant="contained"
          form="basic"
          type={alert.type}
          title={alert.title}
          text={alert.text}
          onClose={() => alertService.remove(alert.id)}
          style={{ width: 390 }}
        />
      ))}
    </div>
  )
}
