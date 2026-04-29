/**
 * Widget principal de Consulta Agropecuaria.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { React, type AllWidgetProps } from "jimu-core"
import '../styles/styles.css'

const Widget = (props: AllWidgetProps<any>) => {
  return (
    <div className="xx-xx-widget">
      <h2>consultaAgropecuaria</h2>
      <p>exampleConfigProperty: {props.config.exampleConfigProperty}</p>
    </div>
  )
}

export default Widget
