import { Label, TextArea } from 'jimu-ui'
import { React } from 'jimu-core'

const InputTextArea = ({ value, onChange, label }) => {
  return (
    <>
        <Label size="default"> {label} </Label>
        <div className="overflow-hidden flex-grow-1   mr-1">
            <TextArea
            className="mb-1"
            required
            onChange={onChange}
            value={value}
            />
        </div>
    </>
  )
}

export default InputTextArea
