import { useEffect, useRef } from 'react'
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { exportService } from '../services/export.service'

/**
 * Configuración necesaria para registrar un popup personalizado
 * con acciones de exportación.
 */
interface PopupConfig {
  /** Título que se mostrará en el popup */
  title: string

  /** Nombre base para los archivos exportados (sin extensión) */
  fileName: string

  /** Campos que se mostrarán en el popup y se exportarán */
  fields: { 
    /** Nombre real del campo en los atributos del feature */
    fieldName: string; 
    
    /** Etiqueta visible en el popup */
    label: string }[]
}

/**
 * Hook reutilizable para gestionar popups de ArcGIS con acciones
 * personalizadas de exportación (CSV y Excel).
 *
 * Este hook:
 * - Observa la disponibilidad del popup en el `view`
 * - Registra un listener para el evento `trigger-action`
 * - Ejecuta exportaciones usando `exportService`
 * - Limpia automáticamente los listeners al desmontar
 *
 * @param view Instancia activa de MapView o SceneView
 *
 * @returns Objeto con la función `registerPopup`
 *
 * @example
 * const { registerPopup } = usePopupManager(view)
 *
 * registerPopup(graphic, {
 *   title: 'Información del predio',
 *   fileName: 'predio',
 *   fields: [
 *     { fieldName: 'NUMERO', label: 'Número Predial' }
 *   ]
 * })
 */
export const usePopupManager = (
  view: __esri.MapView | __esri.SceneView
) => {
  /**
   * Referencia al handle del listener del popup.
   * Permite remover correctamente el evento al desmontar.
   */
  const listenerRef = useRef<__esri.Handle | null>(null)

  /**
   * Configuración actual activa del popup.
   * Se almacena en ref para evitar re-renderizados innecesarios.
   */
  const currentConfigRef = useRef<PopupConfig | null>(null)

  useEffect(() => {

    if (!view) return

    /**
     * Observa cuándo el popup del view está disponible
     * y soporta eventos.
     */
    const popupWatcher = reactiveUtils.when(
      () => view.popup && typeof view.popup.on === 'function',
      () => {

        /**
         * Listener del evento trigger-action del popup.
         * Se ejecuta cuando el usuario hace clic en una acción personalizada.
         */
        listenerRef.current = view.popup.on('trigger-action', (event) => {

          const selectedFeature = view.popup.selectedFeature
          const config = currentConfigRef.current

          if (!selectedFeature || !config) return

          /**
          * Acción exportar CSV
          */
          if (event.action.id === 'export-csv') {
            exportService.exportCSV(
              [selectedFeature],
              config.fileName,
              config.fields.map(f => f.fieldName)
            )
          }

          /**
           * Acción exportar Excel
           */
          if (event.action.id === 'export-excel') {
            exportService.exportExcel(
              [selectedFeature],
              config.fileName,
              config.fields.map(f => f.fieldName)
            )
          }

        })

      }
    )

    /**
     * Cleanup:
     * - Remueve el watcher reactivo
     * - Remueve el listener del popup
     */    
    return () => {
      popupWatcher.remove()
      listenerRef.current?.remove()
    }

  }, [view])

  /**
   * Registra un popup personalizado en un Graphic específico.
   *
   * Asigna:
   * - Título
   * - Campos visibles
   * - Acciones de exportación (CSV / Excel)
   *
   * No abre automáticamente el popup.
   *
   * @param graphic Feature gráfico al que se le asignará el popup
   * @param config Configuración del popup
   */
  const registerPopup = (
    graphic: __esri.Graphic,
    config: PopupConfig
  ) => {

    currentConfigRef.current = config

    graphic.popupTemplate = {
      title: config.title,
      content: [
        {
          type: 'fields',
          fieldInfos: config.fields
        }
      ],
      actions: [
        {
          type: 'button',
          title: 'CSV',
          id: 'export-csv',
          className: 'esri-icon-download'
        },
        {
          type: 'button',
          title: 'Excel',
          id: 'export-excel',
          className: 'esri-icon-table'
        }
      ]
    }
  }

  return {
    registerPopup
  }
}