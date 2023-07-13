import { ChangeEvent, ChangeEventHandler, useEffect, useRef, useState } from "react"

interface IControlledTextArea {
    value: string
    onChange: ChangeEventHandler<HTMLTextAreaElement> | undefined
    [x: string]: any
}

const ControlledTextArea = ({ value, onChange, ...rest }: IControlledTextArea) => {
    const [cursor, setCursor] = useState(0)
    const ref = useRef(null)

    useEffect(() => {
        const input: any = ref.current
        if (input) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            input.setSelectionRange(cursor, cursor)
        }
    }, [ref, cursor, value])

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setCursor(e.target.selectionStart)
        onChange && onChange(e)
    }

    return <textarea ref={ref} value={value} onChange={handleChange} {...rest} />
}

export default ControlledTextArea;
