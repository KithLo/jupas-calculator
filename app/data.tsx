import { useNavigate, useLocation } from "@solidjs/router"
import { mergeDeepLeft } from "rambda"
import {
    Accessor,
    createContext,
    createRenderEffect,
    createResource,
    ParentComponent,
    Show,
    useContext,
} from "solid-js"
import enLocale from "../locales/en.yml"
import tcLocale from "../locales/tc.yml"
import { usePathParams } from "./util"

const suffix = import.meta.env.DEV ? "" : ".min"
const locales: Record<string, any> = {
    en: mergeDeepLeft(enLocale, tcLocale),
    tc: mergeDeepLeft(tcLocale, enLocale),
}

let latestYear = ""

async function loadData(year: string): Promise<Data> {
    const data = await import(
        /* @vite-ignore */ `${import.meta.env.VITE_DATA_BASE_PATH}/${year === latestYear ? "latest" : year}/main${suffix}.js`
    )
    if (year === "latest") {
        latestYear = data.year
    }
    const gradeMap: Record<string, Grade["grades"]> = {}
    for (const { grades, subjects } of data.grades) {
        for (const subject of subjects) {
            gradeMap[subject] = grades
        }
    }
    const institutionMap: Record<string, string> = {}
    for (const [institution, programmes] of Object.entries<any[]>(
        data.programmes,
    )) {
        for (const programme of programmes) {
            institutionMap[programme.id] = institution
        }
    }
    const categoryMap: Record<string, string> = {}
    for (const [key, subjects] of Object.entries<any[]>(
        data.subjectsByCategory,
    )) {
        for (const subject of subjects) {
            categoryMap[subject] = key
        }
    }
    return { ...data, gradeMap, categoryMap, institutionMap }
}

async function loadLocale(year: string, lang: string): Promise<Locale> {
    const fileUrl = `${import.meta.env.VITE_DATA_BASE_PATH}/${year}/${lang}${suffix}.json`
    const resp = await fetch(fileUrl)
    const json = await resp.json()
    const output: any = mergeDeepLeft(json, locales[lang] || {})
    return output
}

const ThisYearDataContext = createContext<Accessor<Data>>(
    () => undefined as unknown as Data,
)

export const useThisYearData = () => useContext(ThisYearDataContext)

const LastYearDataContext = createContext<Accessor<Data | undefined>>(
    () => undefined,
)

export const useLastYearData = () => useContext(LastYearDataContext)

const LocaleContext = createContext<Accessor<Locale>>(
    () => undefined as unknown as Locale,
)

export const useLocale = () => useContext(LocaleContext)

export const DataProvider: ParentComponent = (props) => {
    const navigate = useNavigate()
    const location = useLocation()
    const params = usePathParams()
    const [thisYearData] = createResource(() => params.year, loadData)
    const [lastYearData] = createResource(
        () => {
            const data = thisYearData()
            return data && !data.hasStats ? data.lastYear : null
        },
        async (year) => {
            const result = await loadData(year)
            if (!result.hasStats) return undefined
            return result
        },
    )
    const [locale] = createResource(
        () => [params.year, params.lang] as const,
        ([year, lang]) =>
            import.meta.env.PROD && year === "latest"
                ? undefined!
                : loadLocale(year, lang),
    )

    createRenderEffect(() => {
        if (
            import.meta.env.PROD &&
            thisYearData.state === "ready" &&
            params.year === "latest"
        ) {
            navigate(
                `/${params.lang}/${thisYearData().year}${location.search}`,
                { replace: true },
            )
        }
    })

    return (
        <Show when={thisYearData()}>
            {(_data) => (
                <ThisYearDataContext.Provider value={_data}>
                    <Show when={locale()}>
                        {(_locale) => (
                            <LocaleContext.Provider value={_locale}>
                                <LastYearDataContext.Provider
                                    value={lastYearData}
                                >
                                    {props.children}
                                </LastYearDataContext.Provider>
                            </LocaleContext.Provider>
                        )}
                    </Show>
                </ThisYearDataContext.Provider>
            )}
        </Show>
    )
}
