import clsx from "clsx"
import { ParentComponent } from "solid-js"
import styles from "./Button.module.css"

export const Button: ParentComponent<{
    class?: string
    type?: "button" | "submit" | "reset"
    kind?: "solid" | "outline"
    theme?: "default" | "error"
    disabled?: boolean
    onClick?: (ev: MouseEvent) => void
}> = (props) => {
    return (
        <button
            type={props.type || "button"}
            class={clsx(
                styles.button,
                props.class,
                props.kind === "outline" ? styles.outline : styles.solid,
                styles[props.theme || "default"],
            )}
            disabled={props.disabled}
            onClick={(ev) => props.onClick?.(ev)}
        >
            {props.children}
        </button>
    )
}
