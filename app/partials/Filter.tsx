import { JSX, ParentComponent } from "solid-js"
import { Popup } from "../components/Popup"
import { useClickAway, usePopup } from "../util"
import styles from "./Filter.module.css"

export const Filter: ParentComponent<{
    focus?: boolean
    class?: string
    label?: JSX.Element
    onClose?: () => void
    onClick?: () => void
}> = (props) => {
    let root: HTMLDivElement
    let popup: HTMLDivElement

    useClickAway(
        () => [root!, popup!],
        () => props.onClose?.(),
    )

    usePopup(
        () => root!,
        () => popup!,
        () => !!props.focus,
    )

    function onClick(ev: Event) {
        ev.stopPropagation()
        props.onClick?.()
    }

    return (
        <>
            <div ref={root!} class={props.class} onClick={onClick}>
                {props.label}
            </div>
            <Popup>
                <div
                    ref={popup!}
                    class={styles.popup}
                    onClick={(ev) => ev.stopPropagation()}
                >
                    {props.children}
                </div>
            </Popup>
        </>
    )
}
