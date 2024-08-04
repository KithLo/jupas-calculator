import { Table } from "@tanstack/solid-table"
import clsx from "clsx"
import { IoChevronBack, IoChevronForward } from "solid-icons/io"
import {
    Component,
    createSignal,
    createRenderEffect,
    createMemo,
} from "solid-js"
import { NumberInput } from "../components/NumberInput"
import { Select } from "../components/Select"
import { useLocale } from "../data"
import { TableColumnProvider } from "../table"
import { ListFilter } from "./ListFilter"
import styles from "./Pagination.module.css"

const pageSizeOptions = [10, 20, 50, 100]

export const Pagination: Component<{
    table: Table<ResultRow>
}> = (props) => {
    const locale = useLocale()
    const pageIndex = createMemo(
        () => props.table.getState().pagination.pageIndex,
    )
    const pageSize = createMemo(
        () => props.table.getState().pagination.pageSize,
    )
    const pageCount = createMemo(() => Math.max(1, props.table.getPageCount()))

    const emptyValue = -1
    const [page, setPage] = createSignal(
        // eslint-disable-next-line solid/reactivity
        pageIndex(),
    )

    function handleSubmit(ev: Event) {
        ev.preventDefault()
        onChange(page())
    }

    function onChange(value: number) {
        if (value >= 1 && value <= pageCount()) {
            if (value !== emptyValue) {
                props.table.setPageIndex(value - 1)
            }
            setPage(value)
        }
    }

    createRenderEffect(() => {
        setPage(pageIndex() + 1)
    })

    const studyAreasColumn = createMemo(
        () => props.table.getColumn("studyAreas")!,
    )

    const selectedStudyAreas = createMemo(
        () => (studyAreasColumn().getFilterValue() as string[]) || [],
    )

    const selectedStudyArea = createMemo(() => {
        const values = selectedStudyAreas()
        if (values.length === 0) {
            return locale().UI.AllStudyAreas!
        } else if (values.length === 1) {
            return locale().StudyArea[values[0]!]!
        } else {
            return locale().UI.StudyAreasSelected!.replace(
                "{}",
                String(values.length),
            )
        }
    })

    return (
        <form class={styles.pagination} onSubmit={handleSubmit}>
            <TableColumnProvider value={studyAreasColumn}>
                <ListFilter
                    showCount
                    getLabel={(key, locale) => locale.StudyArea[key]!}
                >
                    <div
                        class={clsx(
                            styles.studyAreas,
                            selectedStudyAreas().length > 0 &&
                                styles.studyAreasActive,
                        )}
                    >
                        {selectedStudyArea()}
                    </div>
                </ListFilter>
            </TableColumnProvider>
            <div class={styles.space} />
            <div>{locale().UI.PageSize}&nbsp;</div>
            <Select
                class={styles.pageSize}
                value={pageSize()}
                onChange={(v) => props.table.setPageSize(v)}
                options={pageSizeOptions}
                getLabel={String}
            />
            <button
                type="button"
                class={styles.paginationButton}
                disabled={!props.table.getCanPreviousPage()}
                onClick={() => props.table.previousPage()}
            >
                <IoChevronBack />
            </button>
            <NumberInput
                class={styles.paginationInput}
                value={page()}
                onChange={setPage}
                onBlur={() => onChange(page())}
                emptyValue={emptyValue}
                error={
                    !Number.isInteger(page()) ||
                    page() <= 0 ||
                    page() > pageCount()
                }
            />
            <span> / {pageCount()}</span>
            <button
                type="button"
                class={styles.paginationButton}
                disabled={!props.table.getCanNextPage()}
                onClick={() => props.table.nextPage()}
            >
                <IoChevronForward />
            </button>
        </form>
    )
}
