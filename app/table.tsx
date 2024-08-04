import { Column, Header } from "@tanstack/solid-table"
import { createContext, createMemo, useContext } from "solid-js"

const HeaderContext = createContext<() => Header<ResultRow, unknown>>(
    () => undefined as any,
)

const ColumnContext = createContext<() => Column<ResultRow, unknown>>(
    () => undefined as any,
)

export const TableHeaderProvider: typeof HeaderContext.Provider = (props) => {
    const header = createMemo(() => props.value())
    const column = createMemo(() => {
        const columnId = header().column.columnDef.meta?.filterColumnId
        if (columnId) {
            return header().getContext().table.getColumn(columnId)!
        }
        return header().column
    })

    return (
        <HeaderContext.Provider value={header}>
            <ColumnContext.Provider value={column}>
                {props.children}
            </ColumnContext.Provider>
        </HeaderContext.Provider>
    )
}

export const TableColumnProvider = ColumnContext.Provider

export function useTableHeader() {
    return useContext(HeaderContext)
}

export function useTableColumn() {
    return useContext(ColumnContext)
}
