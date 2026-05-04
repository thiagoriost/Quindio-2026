/** @jsx jsx */
import { Alert } from 'jimu-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { alertService, type AlertMessage } from '../../shared/services/alert.service'

/**
 * Propiedades de configuración del contenedor de alertas.
 */
interface AlertContainerProps {
  /**
   * Habilita o deshabilita el cierre automático global.
   * @default true
   */
  autoCloseEnabled?: boolean
  /**
   * Duración (ms) para cierre automático cuando la alerta no define `duration`.
   * Si es menor o igual a 0, no se programa cierre automático por fallback.
   * @default 6000
   */
  autoCloseTimeoutMs?: number
}

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
 * @param {AlertContainerProps} [props] - Configuración opcional de comportamiento del auto-cierre.
 * @component
 * @returns {JSX.Element} Contenedor visual con la lista de alertas activas.
 */
export const AlertContainer = ({
  autoCloseEnabled = true,
  autoCloseTimeoutMs = 6000
}: AlertContainerProps) => {
  /**
   * Estado local que contiene la lista de alertas activas.
   */
  const [alerts, setAlerts] = useState<AlertMessage[]>([])

  /**
   * Registro de temporizadores por ID de alerta para evitar duplicados y permitir limpieza explícita.
   */
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /**
   * Cierra una alerta y limpia su timer asociado (si existe).
   *
   * @param {string} alertId - Identificador de la alerta a cerrar.
   * @returns {void}
   */
  const dismissAlert = useCallback((alertId: string): void => {
    const timer = timersRef.current.get(alertId)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(alertId)
    }

    alertService.remove(alertId)
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

  /**
   * Programa el cierre automático de alertas activas.
   *
   * Reglas:
   * - Usa `alert.duration` si está definido.
   * - Si no existe, usa `autoCloseTimeoutMs` como fallback.
   * - No crea timers duplicados para la misma alerta.
   * - Limpia timers de alertas que ya no están activas.
   */
  useEffect(() => {
    if (!autoCloseEnabled) {
      return
    }

    const activeIds = new Set(alerts.map(alert => alert.id))

    alerts.forEach(alert => {
      if (timersRef.current.has(alert.id)) {
        return
      }

      const timeoutMs = alert.duration ?? autoCloseTimeoutMs
      if (!timeoutMs || timeoutMs <= 0) {
        return
      }

      const timeoutId = setTimeout(() => {
        dismissAlert(alert.id)
      }, timeoutMs)

      timersRef.current.set(alert.id, timeoutId)
    })

    timersRef.current.forEach((timerId, alertId) => {
      if (!activeIds.has(alertId)) {
        clearTimeout(timerId)
        timersRef.current.delete(alertId)
      }
    })
  }, [alerts, autoCloseEnabled, autoCloseTimeoutMs, dismissAlert])

  /**
   * Limpia todos los timers pendientes al desmontar el componente.
   */
  useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timerId) => {
        clearTimeout(timerId)
      })
      timers.clear()
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
          onClose={() => { dismissAlert(alert.id) }}
          style={{ width: 390 }}
        />
      ))}
    </div>
  )
}
