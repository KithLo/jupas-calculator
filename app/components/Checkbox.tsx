import clsx from "clsx"
import { IoCheckmark } from "solid-icons/io"
import { ParentComponent, Show } from "solid-js"
import styles from "./Checkbox.module.css"

export const Checkbox: ParentComponent<{
    class?: string
    value: boolean
    onChange?: (value: boolean) => void
}> = (props) => {
    return (
        <div
            class={clsx(styles.checkbox, props.class)}
            onClick={() => props.onChange?.(!props.value)}
        >
            <div class={clsx(styles.icon, props.value && styles.iconActive)}>
                <IoCheckmark class={styles.check} />
            </div>
            <Show when={props.children}>
                <span>{props.children}</span>
            </Show>
        </div>
    )
}
