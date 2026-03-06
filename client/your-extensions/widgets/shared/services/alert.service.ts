/**
 * Tipos de alerta soportados por el sistema.
 */
export type AlertType = 'success' | 'warning' | 'error' | 'info'

/**
 * Representa un mensaje de alerta mostrado en la aplicación.
 */
export interface AlertMessage {
  /**
   * Identificador único de la alerta.
   */
  id: string

  /**
   * Tipo de alerta (success, warning, error, info).
   */
  type: AlertType

  /**
   * Título principal de la alerta.
   */
  title: string

  /**
   * Texto descriptivo opcional.
   */
  text?: string

  /**
   * Duración en milisegundos antes de que la alerta se cierre automáticamente.
   * Si no se define, la alerta puede permanecer visible hasta ser cerrada manualmente.
   */
  duration?: number
}

/**
 * Función observadora que recibe el listado actualizado de alertas.
 */
type Listener = (alerts: AlertMessage[]) => void

/**
 * Servicio global para la gestión de alertas.
 *
 * Implementa un patrón Observer simple donde los componentes
 * pueden suscribirse para reaccionar a cambios en la lista de alertas.
 *
 * Diseñado como singleton global para evitar múltiples instancias
 * en entornos como ArcGIS Experience Builder.
 */
class AlertService {
  /**
   * Lista interna de alertas activas.
   */
  private alerts: AlertMessage[] = []

  /**
   * Lista de listeners suscritos a los cambios.
   */
  private listeners: Listener[] = []

  /**
   * Suscribe un listener para recibir actualizaciones de alertas.
   * Inmediatamente envía el estado actual al suscriptor.
   *
   * @param listener Función que recibirá el listado actualizado de alertas.
   */
  subscribe(listener: Listener) {
    this.listeners.push(listener)
    listener(this.alerts)
  }

  /**
   * Cancela la suscripción de un listener.
   *
   * @param listener Función previamente suscrita.
   */
  unsubscribe(listener: Listener) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * Notifica a todos los listeners registrados
   * enviando el estado actual de las alertas.
   */
  private notify() {
    this.listeners.forEach(l => l(this.alerts))
  }

  /**
   * Agrega una nueva alerta al estado interno
   * y notifica a los suscriptores.
   *
   * @param alert Objeto de alerta a agregar.
   */
  private add(alert: AlertMessage) {
    this.alerts = [...this.alerts, alert]
    this.notify()
  }

  /**
   * Elimina una alerta por su identificador.
   *
   * @param id Identificador único de la alerta.
   */
  remove(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id)
    this.notify()
  }

  /**
   * Método genérico para mostrar una alerta.
   *
   * @param type Tipo de alerta.
   * @param title Título principal.
   * @param text Texto descriptivo opcional.
   * @param duration Duración en milisegundos.
   */
  show(type: AlertType, title: string, text?: string, duration?: number) {
    this.add({
      id: Date.now().toString(),
      type,
      title,
      text,
      duration
    })
  }

  /**
   * Muestra una alerta de tipo éxito.
   *
   * @param title Título principal.
   * @param text Texto opcional.
   * @param duration Duración en milisegundos.
   */
  success(title: string, text?: string, duration?: number) {
    this.show('success', title, text, duration)
  }

  /**
   * Muestra una alerta de tipo advertencia.
   *
   * @param title Título principal.
   * @param text Texto opcional.
   * @param duration Duración en milisegundos.
   */
  warning(title: string, text?: string, duration?: number) {
    this.show('warning', title, text, duration)
  }

  /**
   * Muestra una alerta de tipo error.
   *
   * @param title Título principal.
   * @param text Texto opcional.
   * @param duration Duración en milisegundos.
   */
  error(title: string, text?: string, duration?: number) {
    this.show('error', title, text, duration)
  }

  /**
   * Muestra una alerta informativa.
   *
   * @param title Título principal.
   * @param text Texto opcional.
   * @param duration Duración en milisegundos.
   */
  info(title: string, text?: string, duration?: number) {
    this.show('info', title, text, duration)
  }
}

/**
 * Declaración global para garantizar una única instancia del servicio
 * en el entorno del navegador.
 */
declare global {
  interface Window {
    __GLOBAL_ALERT_SERVICE__?: AlertService
  }
}

/**
 * Inicializa el singleton global si aún no existe.
 * Esto previene múltiples instancias en Experience Builder.
 */
if (!window.__GLOBAL_ALERT_SERVICE__) {
  console.log('AlertService creado (GLOBAL)')
  window.__GLOBAL_ALERT_SERVICE__ = new AlertService()
}

/**
 * Instancia global exportada del servicio de alertas.
 *
 * Puede ser importada en cualquier módulo de la aplicación.
 */
export const alertService = window.__GLOBAL_ALERT_SERVICE__!