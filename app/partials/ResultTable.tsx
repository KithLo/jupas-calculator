import { useSearchParams } from "@solidjs/router"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    ColumnDef,
    createSolidTable,
    getPaginationRowModel,
    PaginationState,
    ColumnSort,
    getSortedRowModel,
    ColumnFiltersState,
    Updater,
    getFacetedRowModel,
    getFacetedUniqueValues,
    CellContext,
    FilterFn,
} from "@tanstack/solid-table"
import clsx from "clsx"
import {
    fromUint8Array as encodeBase64,
    toUint8Array as decodeBase64,
} from "js-base64"
import { pack, unpack } from "msgpackr"
import {
    indexBy,
    isEmpty,
    mapObjIndexed,
    mergeDeepLeft,
    sum,
    values,
} from "rambda"
import { IoCheckmarkCircle, IoCloseCircle } from "solid-icons/io"
import { createMemo, For, Component, createRenderEffect, Show } from "solid-js"
import { useThisYearData, useLocale, useLastYearData } from "../data"
import { useProfiles } from "../profile"
import { round } from "../util"
import { ListFilter } from "./ListFilter"
import { Pagination } from "./Pagination"
import { PassFilter } from "./PassFilter"
import {
    ResultTableHeaderCell,
    ResultTableHeaderRow,
} from "./ResultTableHeader"
import { ScoreValue } from "./ScoreValue"
import { StatFilter } from "./StatFilter"
import { StatValue } from "./StatValue"
import styles from "./ResultTable.module.css"

const fallbackCellValue = "-"

interface TableState {
    pagination: PaginationState
    sorting: ColumnSort[]
    filters: ColumnFiltersState
}

const encodedValues: Record<string, TableState> = {}

function encode(state: TableState) {
    const encoded = encodeBase64(pack(state), true)
    encodedValues[encoded] = state
    return encoded
}

function decode(encoded: string): TableState {
    if (encodedValues[encoded]) return encodedValues[encoded]
    const decoded: any = unpack(decodeBase64(encoded))
    encodedValues[encoded] = decoded
    return decoded
}

const defaultState: TableState = {
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    sorting: [],
    filters: [],
}

function evaluate(scores?: SubjectScores | null): number | undefined {
    return (scores && sum(values(scores))) || undefined
}

const statCell = (data: CellContext<ResultRow, unknown>) => {
    const key = data.column.id as "UQ" | "M" | "LQ"
    const { statistics, deltas, mode } = data.row.original
    const stat = statistics[key]
    const delta = deltas[key]
    if (stat === undefined) {
        return fallbackCellValue
    }
    return <StatValue stat={stat} delta={delta} mode={mode} />
}

const arrayFilter: FilterFn<ResultRow> = (
    row,
    columnId: string,
    filterValue: string[],
) => {
    const value = row.getValue<string>(columnId)
    return filterValue.includes(value)
}

arrayFilter.autoRemove = (val: any) => !val || !val?.length

const columnDefs: ColumnDef<ResultRow>[] = [
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableCode">
                <ListFilter />
            </ResultTableHeaderCell>
        ),
        accessorKey: "id",
        size: 100,
        filterFn: arrayFilter,
        cell: (data) => (
            <a class={styles.code} href={data.row.original.url} target="_blank">
                {data.renderValue() as any}
            </a>
        ),
    },
    {
        header: () => (
            <ResultTableHeaderCell autoSize labelKey="TableName">
                <ListFilter
                    getLabel={(id, locale, data) =>
                        `(${data.institutionMap[id]}) ${locale.Programme[id]!}`
                    }
                />
            </ResultTableHeaderCell>
        ),
        accessorKey: "name",
        filterFn: arrayFilter,
        meta: {
            filterColumnId: "id",
        },
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableInstitution">
                <ListFilter showCount />
            </ResultTableHeaderCell>
        ),
        accessorKey: "institution",
        filterFn: arrayFilter,
        size: 100,
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TablePass">
                <PassFilter />
            </ResultTableHeaderCell>
        ),
        accessorKey: "pass",
        filterFn: "equals",
        size: 80,
        enableSorting: false,
        cell: (data) =>
            data.row.original.pass ? (
                <IoCheckmarkCircle
                    class={clsx(styles.passFailIcon, styles.passIcon)}
                />
            ) : (
                <IoCloseCircle
                    class={clsx(styles.passFailIcon, styles.failIcon)}
                />
            ),
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableScore" withLastYear />
        ),
        id: "score",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (data) => (
            <>
                <ScoreValue
                    code={data.row.original.id}
                    scores={data.row.original.scores}
                >
                    {data.row.original.score}
                </ScoreValue>
                <Show when={data.row.original.lastYearScore}>
                    {" ("}
                    <ScoreValue
                        code={data.row.original.id}
                        scores={data.row.original.lastYearScores}
                        withLastYear
                    >
                        {data.row.original.lastYearScore}
                    </ScoreValue>
                    {")"}
                </Show>
            </>
        ),
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableUQ">
                <StatFilter titleKey="FilterUQ" />
            </ResultTableHeaderCell>
        ),
        id: "UQ",
        size: 130,
        accessorFn: (row) => row.deltas.UQ,
        enableColumnFilter: false,
        cell: statCell,
        sortDescFirst: false,
        sortUndefined: "last",
        filterFn: "inNumberRange",
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableM">
                <StatFilter titleKey="FilterM" />
            </ResultTableHeaderCell>
        ),
        id: "M",
        size: 130,
        accessorFn: (row) => row.deltas.M,
        enableColumnFilter: false,
        cell: statCell,
        sortDescFirst: false,
        sortUndefined: "last",
        filterFn: "inNumberRange",
    },
    {
        header: () => (
            <ResultTableHeaderCell labelKey="TableLQ">
                <StatFilter titleKey="FilterLQ" />
            </ResultTableHeaderCell>
        ),
        id: "LQ",
        size: 130,
        accessorFn: (row) => row.deltas.LQ,
        cell: statCell,
        sortDescFirst: false,
        sortUndefined: "last",
        filterFn: "inNumberRange",
    },
    {
        accessorKey: "studyAreas",
        filterFn: "arrIncludesSome",
        enableSorting: false,
    },
]

export const ResultTable: Component = () => {
    const data = useThisYearData()
    const lastYearData = useLastYearData()
    const locale = useLocale()

    const [searchParams, setSearchParams] = useSearchParams<{
        search?: string
    }>()

    const states = createMemo((): TableState => {
        const search = searchParams.search
        if (!search) {
            return defaultState
        }
        return mergeDeepLeft(decode(search), defaultState)
    })

    const setState = (state: TableState) => {
        const search = encode(state)
        setSearchParams({ search }, { replace: true })
    }

    function createUpdater<K extends keyof TableState>(key: K) {
        // eslint-disable-next-line solid/reactivity
        return (updater: Updater<TableState[K]>) => {
            const s = states()
            if (typeof updater === "function") {
                setState({ ...s, [key]: updater(s[key]) })
            } else {
                setState({ ...s, [key]: updater })
            }
        }
    }

    const setPagination = createUpdater("pagination")
    const setSorting = createUpdater("sorting")
    const setFilter = createUpdater("filters")

    const rawRows = createMemo(() => {
        const maxGrade = data().maxGrade
        return Object.entries(data().programmes).flatMap(
            ([institution, programmes]) =>
                programmes.map(
                    (programme): ResultRawRow => ({
                        ...programme,
                        institution,
                        maxScore: evaluate(
                            programme.weighting(programme.mapGrades(maxGrade)),
                        ),
                    }),
                ),
        )
    })

    const lastYearProgrammes = createMemo(() => {
        const data = lastYearData()
        if (!data) return null
        const maxGrade = data.maxGrade
        return mapObjIndexed(
            (list) =>
                indexBy(
                    (programme) => programme.id,
                    list.map((programme) => ({
                        ...programme,
                        maxScore: evaluate(
                            programme.weighting(programme.mapGrades(maxGrade)),
                        ),
                    })),
                ),
            data.programmes,
        )
    })

    const namedRows = createMemo(() => {
        const output: Record<string, ResultNamedRow> = {}
        for (const row of rawRows()) {
            output[row.id] = {
                name: locale().Programme[row.id]!,
                institutionName: locale().Institution[row.institution]!,
                url: `https://www.jupas.edu.hk/en/programme/${row.institution.toLowerCase()}/${row.id}`,
            }
        }
        return output
    })

    const { activeProfile } = useProfiles()

    const scoredRows = createMemo(() => {
        const subjects = activeProfile().subjects
        const output: Record<string, ResultScoredRow> = {}
        const lastYearProgrammeMap = lastYearProgrammes()
        for (const row of rawRows()) {
            const grade = row.mapGrades(subjects)
            const pass = row.requirement(grade)
            const scores = pass ? row.weighting(grade) : null
            const score = evaluate(scores)
            const result: ResultScoredRow = {
                pass: !!pass && !!scores,
                score: (score && round(score)) || undefined,
                scores: scores || undefined,
                deltas: {},
                statistics: row.statistics,
                mode: "present",
            }
            const lastYearProgramme =
                lastYearProgrammeMap?.[row.institution]?.[row.id]
            if (lastYearProgramme) {
                const grade = lastYearProgramme.mapGrades(subjects)
                const pass = lastYearProgramme.requirement(grade)
                const scores = pass ? lastYearProgramme.weighting(grade) : null
                const score = evaluate(scores)
                result.lastYearScore = (score && round(score)) || undefined
                result.lastYearScores = scores || undefined
                if (score && lastYearProgramme.maxScore) {
                    result.deltas = mapObjIndexed(
                        (v) =>
                            ((v - score) / lastYearProgramme.maxScore!) * 100,
                        lastYearProgramme.statistics,
                    )
                    result.statistics = lastYearProgramme.statistics
                }
                result.mode = "last"
            }
            if (isEmpty(result.statistics) && score && row.maxScore) {
                if (!isEmpty(row.statistics)) {
                    result.deltas = mapObjIndexed(
                        (v) => ((v - score) / row.maxScore!) * 100,
                        row.statistics,
                    )
                } else if (!isEmpty(row.altStatistics)) {
                    result.deltas = mapObjIndexed(
                        (v) => ((v - score) / row.maxScore!) * 100,
                        row.altStatistics,
                    )
                    result.statistics = row.altStatistics
                    result.mode = "alt"
                }
            }
            output[row.id] = result
        }
        return output
    })

    const rows = createMemo(() => {
        return rawRows().map(
            (row): ResultRow => ({
                ...row,
                ...namedRows()[row.id]!,
                ...scoredRows()[row.id]!,
            }),
        )
    })

    const uniqValuesModel = getFacetedUniqueValues<ResultRow>()

    const table = createSolidTable({
        get data() {
            return rows()
        },
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
        renderFallbackValue: fallbackCellValue,

        // filter
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setFilter,

        // pagination
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        autoResetPageIndex: false,

        // sorting
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,

        // faceting
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: (table, columnId) => {
            if (columnId === "studyAreas") {
                return () => {
                    const facetedRowModel = table
                        .getColumn(columnId)!
                        .getFacetedRowModel()
                    const uniqValues = new Map<string, number>()
                    for (const row of facetedRowModel.flatRows) {
                        const values = row.getValue<string[]>(columnId)
                        for (const item of values) {
                            const count = uniqValues.get(item)
                            uniqValues.set(item, (count ?? 0) + 1)
                        }
                    }
                    return uniqValues
                }
            }
            return uniqValuesModel(table, columnId)
        },

        // states
        state: {
            get columnFilters() {
                return states().filters
            },
            get pagination() {
                return states().pagination
            },
            get sorting() {
                return states().sorting
            },
        },

        initialState: {
            columnVisibility: {
                studyAreas: false,
            },
        },

        // debug
        // debugTable: import.meta.env.DEV,
        // debugHeaders: import.meta.env.DEV,
        // debugColumns: import.meta.env.DEV,
    })

    createRenderEffect(() => {
        table.setColumnSizing((state) => ({
            ...state,
            score: lastYearData() ? 110 : 60,
        }))
    })

    createRenderEffect(() => {
        const scores = Object.values(scoredRows() || {})
        table.setColumnVisibility((state) => ({
            ...state,
            UQ: scores.some((p) => p.statistics.UQ),
            M: scores.some((p) => p.statistics.M),
            LQ: scores.some((p) => p.statistics.LQ),
        }))
    })

    createRenderEffect(() => {
        if (states().pagination.pageIndex >= table.getPageCount()) {
            table.setPageIndex(table.getPageCount() - 1)
        }
    })

    return (
        <>
            <Pagination table={table} />
            <table class={styles.table}>
                <thead class={styles.thead}>
                    <For each={table.getHeaderGroups()}>
                        {(headerGroup) => (
                            <ResultTableHeaderRow
                                headers={headerGroup.headers}
                            />
                        )}
                    </For>
                </thead>
                <tbody>
                    <For each={table.getRowModel().rows}>
                        {(row) => (
                            <tr class={styles.row}>
                                <For each={row.getVisibleCells()}>
                                    {(cell) => (
                                        <td class={styles.cell}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    )}
                                </For>
                            </tr>
                        )}
                    </For>
                </tbody>
                <tfoot class={styles.tfoot}>
                    <For each={table.getHeaderGroups()}>
                        {(headerGroup) => (
                            <ResultTableHeaderRow
                                headers={headerGroup.headers}
                            />
                        )}
                    </For>
                </tfoot>
            </table>
            <Pagination table={table} />
        </>
    )
}
