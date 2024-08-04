import { flexRender, Header } from "@tanstack/solid-table"
import clsx from "clsx"
import { IoCaretDown, IoCaretUp } from "solid-icons/io"
import { For, Component, Show, ParentComponent } from "solid-js"
import { Dynamic } from "solid-js/web"
import { useLocale } from "../data"
import { TableHeaderProvider, useTableHeader } from "../table"
import styles from "./ResultTableHeader.module.css"

export const ResultTableHeaderCell: ParentComponent<{
    labelKey: string
    autoSize?: boolean
}> = (props) => {
    const header = useTableHeader()
    const locale = useLocale()
    return (
        <td
            class={clsx(
                styles.headerCell,
                header().column.getCanSort() && styles.headerSortable,
            )}
            style={{
                width: props.autoSize
                    ? "100%"
                    : header().column.getSize() + "px",
            }}
            // eslint-disable-next-line solid/reactivity
            onClick={header().column.getToggleSortingHandler()}
        >
            <div class={styles.headerContent}>
                <div class={styles.headerText}>
                    {locale().UI[props.labelKey]}
                </div>
                <Show when={header().column.getIsSorted()}>
                    {(val) => (
                        <Dynamic
                            component={
                                val() === "asc" ? IoCaretUp : IoCaretDown
                            }
                            class={styles.headerIcon}
                        />
                    )}
                </Show>
                {props.children}
            </div>
        </td>
    )
}

export const ResultTableHeaderRow: Component<{
    headers: Header<ResultRow, unknown>[]
}> = (props) => {
    return (
        <tr class={styles.headerRow}>
            <For each={props.headers}>
                {(header) => (
                    <Show
                        when={!header.isPlaceholder}
                        fallback={<td class={styles.headerCell} />}
                    >
                        <TableHeaderProvider value={() => header}>
                            {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                            )}
                        </TableHeaderProvider>
                    </Show>
                )}
            </For>
        </tr>
    )
}
