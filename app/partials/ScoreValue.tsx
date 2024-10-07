import { IoArrowForward } from "solid-icons/io"
import { createMemo, For, ParentComponent, Show } from "solid-js"
import { Tooltip } from "../components/Tooltip"
import { useLastYearData, useLocale, useThisYearData } from "../data"
import { useProfiles } from "../profile"
import { round } from "../util"
import styles from "./ScoreValue.module.css"

const ScoreFormula: ParentComponent<{
    code: string
    withLastYear?: boolean
    isCombinedScore?: boolean
    scores: SubjectScores
}> = (props) => {
    const locale = useLocale()
    const { activeProfile } = useProfiles()
    const data = useThisYearData()
    const lastYearData = useLastYearData()
    const rows = createMemo(() =>
        Object.entries(activeProfile().subjects)
            .filter(([subject]) => props.scores[subject])
            .map(([subject, grade]) => ({
                subject: locale().Subject[subject]!,
                grade,
                score: props.scores[subject]!,
            })),
    )

    const year = createMemo(() => {
        const thisYear = data().year
        if (!props.withLastYear && !props.isCombinedScore) return thisYear
        const lastYear = lastYearData()?.year
        if (!lastYear) return thisYear
        return props.isCombinedScore ? `${thisYear} / ${lastYear}` : lastYear
    })

    return (
        <div class={styles.formula}>
            <div class={styles.formulaCode}>
                {props.code} ({year()})
            </div>
            <For each={rows()}>
                {(item) => (
                    <>
                        <div class={styles.formulaSubject}>{item.subject}</div>
                        <div>{item.grade}</div>
                        <IoArrowForward />
                        <div>{round(item.score, 2)}</div>
                    </>
                )}
            </For>
            <div class={styles.formulaLine} />
            <div class={styles.formulaResult}>{props.children}</div>
        </div>
    )
}

export const ScoreValue: ParentComponent<{
    code: string
    scores?: SubjectScores
    withLastYear?: boolean
    isCombinedScore?: boolean
}> = (props) => {
    return (
        <Show when={!!props.scores} fallback={props.children}>
            <Tooltip
                text={
                    <ScoreFormula
                        code={props.code}
                        scores={props.scores!}
                        withLastYear={props.withLastYear}
                        isCombinedScore={props.isCombinedScore}
                        children={props.children}
                    />
                }
            >
                {props.children}
            </Tooltip>
        </Show>
    )
}
