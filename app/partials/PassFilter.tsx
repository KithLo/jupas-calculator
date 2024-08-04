import { ParentComponent, createSignal } from "solid-js"
import { Toggle } from "../components/Toggle"
import { useLocale } from "../data"
import { useTableColumn } from "../table"
import { Filter } from "./Filter"
import { FilterIcon } from "./FilterIcon"
import styles from "./PassFilter.module.css"

export const PassFilter: ParentComponent<{ class?: string }> = (props) => {
    const locale = useLocale()

    const [focus, setFocus] = createSignal(false)
    const column = useTableColumn()

    const onClick = () => {
        setFocus(true)
    }

    const onToggle = () => {
        column().setFilterValue(column().getFilterValue() ? undefined : true)
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
            <div class={styles.passFilter} onClick={onToggle}>
                <Toggle value={(column().getFilterValue() as any) || false} />
                <div>{locale().UI.PassFilter}</div>
            </div>
        </Filter>
    )
}
