import clsx from "clsx"
import { For, JSX, createSignal, Show, createMemo } from "solid-js"
import { useClickAway, usePopup } from "../util"
import { Popup } from "./Popup"
import styles from "./Select.module.css"

const hasNativeSelect = window.orientation !== undefined

interface Props<T> {
    class?: string
    value?: T
    placeholder?: string
    onChange?: (t: T) => void
    getLabel: (t: T) => string | undefined
    options: T[]
    isSelected?: (t: T) => boolean
    error?: boolean
    disabled?: boolean
}

function NativeSelect<T>(props: Props<T>): JSX.Element {
    function isSelected(option: T): boolean {
        return props.isSelected?.(option) || props.value === option
    }

    const list = createMemo(() =>
        props.options.map((item) => ({
            item,
            label: props.getLabel(item),
            selected: isSelected(item),
        })),
    )

    return (
        <select
            class={clsx(
                props.class,
                styles.select,
                styles.nativeSelect,
                props.error && styles.error,
                props.disabled && styles.disabled,
            )}
            onChange={(e) => {
                const item = list().find(
                    ({ label }) => label === e.currentTarget.value,
                )?.item
                if (item) {
                    props.onChange?.(item)
                }
            }}
        >
            <option
                selected={!list().find(({ selected }) => selected)}
                disabled
            />
            <For each={list()}>
                {(option) => (
                    <option selected={option.selected}>{option.label}</option>
                )}
            </For>
        </select>
    )
}

function StyledSelect<T>(props: Props<T>): JSX.Element {
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
                                {props.getLabel(option) || <br />}
                            </div>
                        )}
                    </For>
                </div>
            </Popup>
        </>
    )
}

export function Select<T>(props: Props<T>): JSX.Element {
    return (
        <Show when={hasNativeSelect} fallback={<StyledSelect {...props} />}>
            <NativeSelect {...props} />
        </Show>
    )
}
