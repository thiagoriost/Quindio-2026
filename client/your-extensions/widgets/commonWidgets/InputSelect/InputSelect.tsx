import { React } from 'jimu-core'
import { Label, Select } from 'jimu-ui' // import components

// @ts-expect-error
import './style.css'

const InputSelect = ({
  dataArray = [{ value: 1, label: 'prueba1' }, { value: 2, label: 'prueba2' }],
  onChange,
  value = undefined,
  label = 'Campo',
  campo = '',
  placeHolder = `Seleccione  ${label}...`
}) => {
  // console.log({dataArray, campo})
  const data = dataArray.length ? dataArray : dataArray[campo]
  return (
    <div >
        <Label size='sm' style={{ padding: '1px' }}> {label} </Label>
        <Select
            onChange={onChange}
            placeholder={placeHolder}
            value={value}
        >
            {
                data &&
                    data.map(
                      ({ value, label }) => (
                          <option value={value}>{label}</option>
                      ))
            }
        </Select>
    </div>
  )
}

export default InputSelect
