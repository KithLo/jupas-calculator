import clsx from "clsx"
import { For, JSX, createSignal } from "solid-js"
import { useClickAway, usePopup } from "../util"
import { Popup } from "./Popup"
import styles from "./Select.module.css"

export function Select<T>(props: {
    class?: string
    value?: T
    placeholder?: string
    onChange?: (t: T) => void
    getLabel: (t: T) => JSX.Element
    options: T[]
    isSelected?: (t: T) => boolean
    error?: boolean
    disabled?: boolean
}): JSX.Element {
    let select: HTMLDivElement
    let dropdown: HTMLDivElement

    const [focus, setFocus] = createSignal(false)

    function isSelected(option: T): boolean {
        return props.isSelected?.(option) || props.value === option
    }

    useClickAway(
        () => [select!, dropdown!],
        () => setFocus(false),
    )

    usePopup(
        () => select!,
        () => dropdown!,
        focus,
        {
            before: () => {
                dropdown.style.width = select.offsetWidth + "px"
            },
            after: () => {
                const selected = props.options.findIndex(isSelected)
                if (selected > -1) {
                    dropdown.children[selected]!.scrollIntoView({
                        behavior: "instant",
                        block: "center",
                        inline: "start",
                    })
                }
            },
        },
    )

    function onClick() {
        if (!props.disabled) {
            setFocus(true)
        }
    }

    return (
        <>
            <div
                ref={select!}
                class={clsx(
                    props.class,
                    styles.select,
                    focus() && styles.focus,
                    props.error && styles.error,
                    props.disabled && styles.disabled,
                )}
                onClick={onClick}
            >
                {props.value !== undefined
                    ? props.getLabel(props.value)
                    : props.placeholder}
            </div>
            <Popup>
                <div ref={dropdown!} class={styles.dropdown}>
                    <For each={props.options}>
                        {(option) => (
                            <div
                                class={clsx(
                                    styles.item,
                                    isSelected(option) && styles.selected,
                                )}
                                onClick={() => {
                                    setFocus(false)
                                    props.onChange?.(option)
                                }}
                            >
                                {props.getLabel(option)}
                            </div>
                        )}
                    </For>
                </div>
            </Popup>
        </>
    )
}
