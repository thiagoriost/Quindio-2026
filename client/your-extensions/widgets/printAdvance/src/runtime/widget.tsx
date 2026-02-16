/**
 * @fileoverview Widget Advanced Print para ArcGIS Experience Builder.
 * Permite a los usuarios imprimir mapas con diferentes plantillas, formatos y resoluciones.
 *
 * @module advanced-print/widget
 * @description
 * **Función Principal del Widget:**
 * Este widget proporciona una interfaz de usuario para generar impresiones de mapas
 * utilizando el servicio de impresión de ArcGIS Server. Los usuarios pueden:
 * - Seleccionar plantillas de layout dinámicamente desde el servidor
 * - Elegir formato de salida (PDF, PNG, JPG)
 * - Configurar la resolución (DPI) del documento
 * - Generar y descargar el documento impreso
 *
 * El widget se comunica con el Print Service del IGAC para generar documentos
 * que incluyen la vista actual del mapa, capas visibles y mapa base.
 */

import { React } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis"
import { usePrint } from "./usePrint"
import { useLayoutTemplates } from "./useLayoutTemplates"

const { useState } = React

/**
 * Componente principal del widget Advanced Print.
 * Renderiza controles para configurar y ejecutar impresiones de mapas.
 *
 * @function Widget
 * @param {Object} props - Propiedades del widget de Experience Builder
 * @param {string[]} props.useMapWidgetIds - IDs de los widgets de mapa conectados
 * @returns {JSX.Element} Interfaz de configuración de impresión
 *
 * @example
 * // En manifest.json, configurar:
 * // "properties": { "canEditInRuntime": true }
 *
 * // El widget se conecta automáticamente al Map Widget configurado
 * // y muestra opciones de impresión al usuario.
 */
export default function Widget(props: any) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [selectedLayout, setSelectedLayout] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "png32" | "jpg">("pdf")
  const [dpi, setDpi] = useState<number>(96)

  const { print, loading, error } = usePrint(jimuMapView)
  const { templates, loading: loadingTemplates } = useLayoutTemplates()

  // Seleccionar primera plantilla cuando se cargan
  React.useEffect(() => {
    if (templates.length > 0 && !selectedLayout) {
      setSelectedLayout(templates[0].layoutTemplate)
    }
  }, [templates, selectedLayout])

  return (
    <div className="print-widget p-3">
      <div className="mb-3">
        <label className="form-label">Plantilla</label>
        <select
          className="form-select"
          value={selectedLayout}
          onChange={(e) => { setSelectedLayout(e.target.value) }}
          disabled={loadingTemplates}
        >
          {loadingTemplates ? (
            <option>Cargando plantillas...</option>
          ) : (
            templates.map((t) => (
              <option key={t.layoutTemplate} value={t.layoutTemplate}>
                {t.layoutTemplate}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Formato</label>
        <select
          className="form-select"
          value={selectedFormat}
          onChange={(e) => { setSelectedFormat(e.target.value as "pdf" | "png32" | "jpg") }}
        >
          <option value="pdf">PDF</option>
          <option value="png32">PNG</option>
          <option value="jpg">JPG</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">DPI</label>
        <select
          className="form-select"
          value={dpi}
          onChange={(e) => { setDpi(Number(e.target.value)) }}
        >
          <option value={96}>96</option>
          <option value={150}>150</option>
          <option value={300}>300</option>
        </select>
      </div>

      <button
        className="btn btn-primary w-100"
        disabled={loading || !selectedLayout}
        onClick={() =>
          print({
            layout: selectedLayout,
            format: selectedFormat,
            dpi: dpi
          })
        }
      >
        {loading ? "Imprimiendo..." : "Imprimir"}
      </button>

      {error && <p style={{ color: "var(--sys-color-error)", marginTop: "0.5rem" }}>{error}</p>}

      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={setJimuMapView}
      />
    </div>
  )
}
