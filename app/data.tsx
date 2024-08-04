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
    const gradeListMap: Record<string, string[]> = {}
    for (const { grades, subjects } of data.grades) {
        const list = Object.keys(grades)
        list.sort((a, b) => grades[b]! - grades[a]!)
        for (const subject of subjects) {
            gradeMap[subject] = grades
            gradeListMap[subject] = list
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
    return { ...data, gradeMap, gradeListMap, categoryMap, institutionMap }
}

async function loadLocale(year: string, lang: string): Promise<Locale> {
    const fileUrl = `${import.meta.env.VITE_DATA_BASE_PATH}/${year}/${lang}${suffix}.json`
    const resp = await fetch(fileUrl)
    const json = await resp.json()
    const output: any = mergeDeepLeft(json, locales[lang] || {})
    return output
}

const DataContext = createContext<Accessor<Data>>(
    () => undefined as unknown as Data,
)

export const useData = () => useContext(DataContext)

const LocaleContext = createContext<Accessor<Locale>>(
    () => undefined as unknown as Locale,
)

export const useLocale = () => useContext(LocaleContext)

export const DataProvider: ParentComponent = (props) => {
    const navigate = useNavigate()
    const location = useLocation()
    const params = usePathParams()
    const [data] = createResource(() => params.year, loadData)
    const [locale] = createResource(
        () => [params.year, params.lang] as const,
        ([year, lang]) =>
            year === "latest" ? undefined! : loadLocale(year, lang),
    )

    createRenderEffect(() => {
        if (data.state === "ready" && params.year === "latest") {
            navigate(`/${params.lang}/${data().year}${location.search}`, {
                replace: true,
            })
        }
    })

    return (
        <Show when={data()}>
            {(_data) => (
                <DataContext.Provider value={_data}>
                    <Show when={locale()}>
                        {(_locale) => (
                            <LocaleContext.Provider value={_locale}>
                                {props.children}
                            </LocaleContext.Provider>
                        )}
                    </Show>
                </DataContext.Provider>
            )}
        </Show>
    )
}
