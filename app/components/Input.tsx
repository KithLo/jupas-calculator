import clsx from "clsx"
import { Component } from "solid-js"
import styles from "./Input.module.css"

export const Input: Component<{
    class?: string
    value: string
    onChange?: (value: string) => void
    error?: boolean
    disabled?: boolean
    maxLength?: number
}> = (props) => (
    <input
        class={clsx(
            styles.input,
            props.class,
            props.error && styles.error,
            props.disabled && styles.disabled,
        )}
        onInput={(ev) => props.onChange?.(ev.currentTarget.value)}
        value={props.value}
        maxLength={props.maxLength}
        disabled={props.disabled}
    />
)
