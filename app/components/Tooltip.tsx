import clsx from "clsx"
import { JSX, ParentComponent, createSignal } from "solid-js"
import { usePopup } from "../util"
import { Popup } from "./Popup"
import styles from "./Tooltip.module.css"

export const Tooltip: ParentComponent<{ text: JSX.Element; class?: string }> = (
    props,
) => {
    let root: HTMLDivElement
    let popup: HTMLDivElement

    const [focus, setFocus] = createSignal(false)

    usePopup(
        () => root!,
        () => popup!,
        focus,
        { placement: "top" },
    )

    return (
        <span
            ref={root!}
            class={clsx(styles.tooltip, props.class)}
            onMouseEnter={() => setFocus(true)}
            onMouseLeave={() => setFocus(false)}
        >
            {props.children}
            <Popup>
                <div ref={popup!} class={styles.popup}>
                    {props.text}
                </div>
            </Popup>
        </span>
    )
}
