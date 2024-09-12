import Fuse from "fuse.js"
import { For, JSX, batch, createMemo, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { Button } from "../components/Button"
import { Checkbox } from "../components/Checkbox"
import { Input } from "../components/Input"
import { useThisYearData, useLocale } from "../data"
import { useTableColumn } from "../table"
import { Filter } from "./Filter"
import { FilterIcon } from "./FilterIcon"
import styles from "./ListFilter.module.css"

type Item = { value: string; label: string; selected: boolean; index: number }

export function ListFilter(props: {
    class?: string
    showCount?: boolean
    getLabel?: (key: string, locale: Locale, data: Data) => string
    children?: JSX.Element
}): JSX.Element {
    const data = useThisYearData()
    const locale = useLocale()

    const [focus, setFocus] = createSignal(false)
    const [list, setList] = createStore<Item[]>([])
    const [search, setSearch] = createSignal("")
    const column = useTableColumn()

    const onClick = () => {
        const col = column()
        const filterValue = (col.getFilterValue() as string[]) || []
        const values = col.getFacetedUniqueValues()
        const options = Array.from(values.keys()).sort()
        batch(() => {
            setSearch("")
            const all = options.map((option, index) => {
                return {
                    index,
                    value: option,
                    label:
                        (props.getLabel
                            ? props.getLabel(option, locale(), data())
                            : option) +
                        (props.showCount ? ` (${values.get(option)})` : ""),
                    selected: filterValue.includes(option),
                }
            })
            setList(all)
            setFocus(true)
        })
    }

    const fuse = createMemo(
        () => new Fuse(list, { keys: ["label"], threshold: 0.2 }),
    )

    const filtered = createMemo(() =>
        search()
            ? fuse()
                  .search(search())
                  .map((x) => x.item)
            : list,
    )

    const onReset = () => {
        batch(() => {
            list.forEach((_t, index) => {
                setList(index, "selected", false)
            })
        })
    }

    const onConfirm = () => {
        column().setFilterValue(
            list.filter((x) => x.selected).map((x) => x.value),
        )
        setFocus(false)
    }

    const count = createMemo(() => list.filter((item) => item.selected).length)

    const hasSelectedAll = createMemo(() =>
        filtered().every((item) => item.selected),
    )

    const onSelectAll = () => {
        const select = !hasSelectedAll()
        batch(() => {
            filtered().forEach((item) => {
                setList(item.index, "selected", select)
            })
        })
    }

    return (
        <Filter
            class={props.class}
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
                <Checkbox value={hasSelectedAll()} onChange={onSelectAll}>
                    {locale().UI.FilterSelect} ({filtered().length})
                </Checkbox>
                <Input
                    class={styles.search}
                    value={search()}
                    onChange={setSearch}
                />
            </div>
            <div class={styles.list}>
                <For each={filtered()}>
                    {(option) => (
                        <Checkbox
                            class={styles.item}
                            value={option.selected}
                            onChange={(v) =>
                                setList(option.index, "selected", v)
                            }
                        >
                            {option.label}
                        </Checkbox>
                    )}
                </For>
            </div>
            <div class={styles.buttons}>
                <Button kind="outline" onClick={onReset}>
                    {locale().UI.ResetButton}
                </Button>
                <Button onClick={onConfirm}>
                    {locale().UI.ConfirmButton} ({count()})
                </Button>
            </div>
        </Filter>
    )
}
