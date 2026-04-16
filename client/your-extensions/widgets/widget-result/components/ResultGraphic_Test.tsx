/**
 * Componente de prueba para verificar el funcionamiento de ResultGraphic.
 *
 * Permite alternar entre gráfico de barras y de pastel,
 * cambiar los datos de ejemplo, y probar con datos vacíos.
 *
 * @component
 */
import { React } from "jimu-core"
import ResultGraphic from "./ResultGraphic_Richarts"

const { useState } = React

const sampleDataA = [
  { name: "Bogotá", value: 120 },
  { name: "Medellín", value: 85 },
  { name: "Cali", value: 70 },
  { name: "Barranquilla", value: 55 },
  { name: "Cartagena", value: 40 }
]

const sampleDataB = [
  { categoria: "Residencial", cantidad: 300 },
  { categoria: "Comercial", cantidad: 150 },
  { categoria: "Industrial", cantidad: 80 },
  { categoria: "Institucional", cantidad: 60 },
  { categoria: "Rural", cantidad: 200 },
  { categoria: "Mixto", cantidad: 110 },
  { categoria: "Baldío", cantidad: 45 }
]

const sampleDataC = [
  { label: "2020", total: 1200 },
  { label: "2021", total: 1350 },
  { label: "2022", total: 1500 },
  { label: "2023", total: 1420 },
  { label: "2024", total: 1600 },
  { label: "2025", total: 1750 }
]

const datasets = [
  { id: "A", label: "Ciudades (name/value)", data: sampleDataA, xKey: "name", yKey: "value" },
  { id: "B", label: "Uso de suelo (categoria/cantidad)", data: sampleDataB, xKey: "categoria", yKey: "cantidad" },
  { id: "C", label: "Histórico anual (label/total)", data: sampleDataC, xKey: "label", yKey: "total" },
  { id: "empty", label: "Sin datos (vacío)", data: [], xKey: "name", yKey: "value" },
  { id: "null", label: "Datos null", data: null, xKey: "name", yKey: "value" }
]

const ResultGraphicTest = () => {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const [datasetIndex, setDatasetIndex] = useState(0)
  const [showTitle, setShowTitle] = useState(true)

  const currentDataset = datasets[datasetIndex]

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Prueba de ResultGraphic</h3>

      {/* Controles */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          Tipo:
          <select value={chartType} onChange={(e) => { setChartType(e.target.value as "bar" | "pie") }}>
            <option value="bar">Barras</option>
            <option value="pie">Pastel</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          Datos:
          <select value={datasetIndex} onChange={(e) => { setDatasetIndex(Number(e.target.value)) }}>
            {datasets.map((ds, i) => (
              <option key={ds.id} value={i}>{ds.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => { setShowTitle(e.target.checked) }} />
          Mostrar título
        </label>
      </div>

      {/* Info del dataset actual */}
      <div style={{ fontSize: 12, color: "#666" }}>
        Dataset: <strong>{currentDataset.label}</strong> |
        xKey: <code>{currentDataset.xKey}</code> |
        yKey: <code>{currentDataset.yKey}</code> |
        Registros: {currentDataset.data?.length ?? "null"}
      </div>

      {/* Contenedor del gráfico */}
      <div style={{ flex: 1, minHeight: 300, border: "1px solid #ccc", borderRadius: 4 }}>
        <ResultGraphic
          data={currentDataset.data}
          type={chartType}
          xKey={currentDataset.xKey}
          yKey={currentDataset.yKey}
          title={showTitle ? `Gráfico: ${currentDataset.label}` : undefined}
        />
      </div>
    </div>
  )
}

export default ResultGraphicTest
