import { clamp } from "rambda"
import { FaSolidGreaterThan, FaSolidLessThan } from "solid-icons/fa"
import { TbTilde } from "solid-icons/tb"
import { VsDash } from "solid-icons/vs"
import {
    Accessor,
    Component,
    JSX,
    ParentComponent,
    batch,
    createMemo,
    createSignal,
} from "solid-js"
import { Button } from "../components/Button"
import { useLocale } from "../data"
import { useSettings } from "../settings"
import { useTableColumn } from "../table"
import { getStatColor } from "../util"
import { Filter } from "./Filter"
import { FilterIcon } from "./FilterIcon"
import { StatDelta } from "./StatValue"
import styles from "./StatFilter.module.css"

const maxValue = 10
const minValue = -10
const total = maxValue - minValue

const trim = clamp(minValue, maxValue)

function fixValue(value: number): number {
    return trim(Math.round(value * 10) / 10)
}

function getPercent(value: number) {
    return `${((value - minValue) * 100) / total}%`
}

export const Thumb: Component<{
    ref?: HTMLDivElement
    value: number
    onPointerDown: (ev: PointerEvent) => void
    onPointerMove: (ev: PointerEvent) => void
}> = (props) => {
    const [settings] = useSettings()
    return (
        <div
            ref={props.ref}
            class={styles.thumb}
            style={{
                left: getPercent(props.value),
                "background-color": getStatColor(
                    props.value,
                    settings.darkMode,
                ),
            }}
            onPointerDown={(ev) => props.onPointerDown(ev)}
            onPointerMove={(ev) => props.onPointerMove(ev)}
        />
    )
}

export const Slider: Component<{
    value1: number
    value2: number
    onValue1Change: (value: number) => void
    onValue2Change: (value: number) => void
}> = (props) => {
    let thumb1: HTMLDivElement
    let thumb2: HTMLDivElement
    let slider: HTMLDivElement

    const pointerEvents = (
        getThumb: Accessor<HTMLDivElement>,
        getValue: Accessor<number>,
        setValue: (value: number) => void,
    ) => {
        let x: number = 0
        let value: number = 0

        return {
            onPointerDown: (ev: PointerEvent) => {
                x = ev.clientX
                value = getValue()
                getThumb().setPointerCapture(ev.pointerId)
            },
            onPointerMove: (ev: PointerEvent) => {
                const thumb = getThumb()
                if (!thumb.hasPointerCapture(ev.pointerId)) return
                const delta = ev.clientX - x
                const size = Math.round(slider.getBoundingClientRect().width)
                const rawValue = (total * delta) / size + value
                setValue(fixValue(rawValue))
            },
        }
    }

    const min = createMemo(() =>
        props.value1 < props.value2 ? props.value1 : props.value2,
    )
    const max = createMemo(() =>
        props.value1 > props.value2 ? props.value1 : props.value2,
    )

    return (
        <div ref={slider!} class={styles.slider}>
            <div
                class={styles.track}
                style={{ left: 0, width: getPercent(min()) }}
            />
            <div
                class={styles.track}
                style={{ left: getPercent(max()), right: 0 }}
            />
            <Thumb
                ref={thumb1!}
                value={props.value1}
                {...pointerEvents(
                    () => thumb1,
                    () => props.value1,
                    (val) => props.onValue1Change(val),
                )}
            />
            <Thumb
                ref={thumb2!}
                value={props.value2}
                {...pointerEvents(
                    () => thumb2,
                    () => props.value2,
                    (val) => props.onValue2Change(val),
                )}
            />
        </div>
    )
}

export const StatFilter: ParentComponent<{
    class?: string
    titleKey: string
}> = (props) => {
    const locale = useLocale()

    const [focus, setFocus] = createSignal(false)
    const column = useTableColumn()

    const [value1, setValue1] = createSignal(minValue)
    const [value2, setValue2] = createSignal(maxValue)

    const onClick = () => {
        batch(() => {
            const [val1 = minValue, val2 = maxValue] =
                (column().getFilterValue() as [number?, number?]) || []
            setValue1(val1)
            setValue2(val2)
            setFocus(true)
        })
    }

    const onReset = () => {
        setValue1(minValue)
        setValue2(maxValue)
    }

    const onConfirm = () => {
        const vals = [value1(), value2()].sort((a, b) => a - b) as [
            number?,
            number?,
        ]
        if (vals[0] !== vals[1]) {
            if (vals[0] === minValue) {
                vals[0] = undefined
            }
            if (vals[1] === maxValue) {
                vals[1] = undefined
            }
        }
        column().setFilterValue(
            vals[0] === undefined && vals[1] === undefined ? undefined : vals,
        )
        setFocus(false)
    }

    const range = (): JSX.Element => {
        const vals: [number, number] = [value1(), value2()]
        vals.sort((a, b) => a - b)
        if (vals[0] === vals[1]) {
            return <StatDelta delta={vals[0]} />
        } else if (vals[0] === minValue) {
            if (vals[1] === maxValue) {
                return <VsDash />
            } else {
                return (
                    <>
                        <FaSolidLessThan class={styles.compare} />
                        <StatDelta delta={vals[1]} />
                    </>
                )
            }
        } else if (vals[1] === maxValue) {
            return (
                <>
                    <FaSolidGreaterThan class={styles.compare} />
                    <StatDelta delta={vals[0]} />
                </>
            )
        } else {
            return (
                <>
                    <StatDelta delta={vals[0]} />
                    <TbTilde />
                    <StatDelta delta={vals[1]} />
                </>
            )
        }
    }

    return (
        <Filter
            label={
                props.children || (
                    <FilterIcon active={column().getIsFiltered()} />
                )
            }
            focus={focus()}
            onClick={onClick}
            onClose={() => setFocus(false)}
        >
            <div class={styles.header}>
                <div class={styles.title}>{locale().UI[props.titleKey]}</div>
                <div class={styles.range}>{range()}</div>
            </div>
            <Slider
                value1={value1()}
                value2={value2()}
                onValue1Change={setValue1}
                onValue2Change={setValue2}
            />
            <div class={styles.buttons}>
                <Button kind="outline" onClick={onReset}>
                    {locale().UI.ResetButton}
                </Button>
                <Button onClick={onConfirm}>{locale().UI.ConfirmButton}</Button>
            </div>
        </Filter>
    )
}
