import { React } from "jimu-core"
import { Label, Select, Option } from "jimu-ui"

interface interfaceCategories { id: number, name: string }
interface interfaceMunicipio { IDMUNICIPIO: string, MUNICIPIO: string }
interface interfaceEstablecimiento { NOMBREESTABLECIMIENTO: string, CODIGOESTABLECIMIENTO: string, DIRECCION: string, JORNADA: string, IMAGEN: string, geometry: __esri.Geometry, IDSECTOR: string, IDZONA: string, IDTIPOSEDE: string, IDGRUPO: string }

interface FormEducacionProps {
  loading: boolean
  categories: interfaceCategories[] | null
  selectedCategory: number | null
  onCategoriesChange: (e: { target: { value: any } }) => void
  municipios: interfaceMunicipio[] | null
  selectedMunicipio: interfaceMunicipio | null
  onMunicipioChange: (e: { target: { value: any } }) => void
  establecimientos: interfaceEstablecimiento[] | null
  selectedEstablecimiento: interfaceEstablecimiento | null
  onEstablecimientoChange: (e: { target: { value: any } }) => void
}

const FormEducacion = ({
  loading,
  categories,
  selectedCategory,
  onCategoriesChange,
  municipios,
  selectedMunicipio,
  onMunicipioChange,
  establecimientos,
  selectedEstablecimiento,
  onEstablecimientoChange
}: FormEducacionProps) => {
  return (
    <>
      <Label>Categoria</Label>

      <Select
        value={selectedCategory ?? ""}
        disabled={loading}
        onChange={onCategoriesChange}
      >
        <Option value="">
          {loading ? 'Cargando ...' : 'Seleccione...'}
        </Option>

        {categories?.map(field => (
          <Option key={field.id} value={field.id}>
            {field.name}
          </Option>
        ))}
      </Select>


      {/* Municipio */}

      <Label>Municipio</Label>
      <Select
        value={selectedMunicipio?.IDMUNICIPIO ?? ""}
        disabled={loading}
        onChange={onMunicipioChange}
      >
        <Option value="">
          {loading ? 'Cargando ...' : 'Seleccione...'}
        </Option>

        {municipios?.map(mun => (
          <Option key={mun.IDMUNICIPIO} value={mun.IDMUNICIPIO}>
            {mun.MUNICIPIO}
          </Option>
        ))}
      </Select>

      {/* Atributo */}

      <Label>Atributo</Label>
      <Select
        value={selectedEstablecimiento?.NOMBREESTABLECIMIENTO ?? ""}
        disabled={loading}
        onChange={onEstablecimientoChange}
      >
        <Option value="">
          {loading ? 'Cargando ...' : 'Seleccione...'}
        </Option>

        {establecimientos?.map((est, idx) => (
          <Option key={idx} value={est.NOMBREESTABLECIMIENTO}>
            {est.NOMBREESTABLECIMIENTO}
          </Option>
        ))}
      </Select>
    </>
  )
}

export default FormEducacion
