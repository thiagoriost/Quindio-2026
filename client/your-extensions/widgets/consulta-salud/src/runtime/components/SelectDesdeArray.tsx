/** @jsx jsx */
import { jsx } from 'jimu-core'
import { Select, Label, Option } from 'jimu-ui'

export default function SelectDesdeArray({label, disabled, array, valor, onChange, setValor}) {
    return (
        <>
        <Label>{label}</Label>        
        <Select        
        value={valor}
        onChange={ onChange ? (e) => onChange(e) : (e) => setValor(e.target.value)  }
        disabled={disabled}>
            <Option value="">Seleccione...</Option>
            
            {array.map((option) => (
            <Option key={option.value} value={option.value}>
                {option.label}
            </Option>
            ))}
        </Select>
        </>
    )
}


