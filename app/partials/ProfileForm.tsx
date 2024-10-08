import { IoClose } from "solid-icons/io"
import {
    Component,
    createRenderEffect,
    createMemo,
    createSignal,
    Index,
} from "solid-js"
import { createStore } from "solid-js/store"
import { Button } from "../components/Button"
import { Collapsable } from "../components/Collapsable"
import { Popup } from "../components/Popup"
import { Select } from "../components/Select"
import { useThisYearData, useLocale } from "../data"
import { useProfiles } from "../profile"
import { useClickAway, usePopup } from "../util"
import { ProfileSelector } from "./ProfileSelector"
import styles from "./ProfileForm.module.css"

interface SubjectRow {
    category: string
    subject: string
    subjectList: string[]
    grade: string
    gradeList: string[]
}

interface RowErrors {
    categoryError?: boolean
    subjectError?: boolean
    gradeError?: boolean
}

const ProfileRow: Component<
    SubjectRow &
        RowErrors & {
            categoryList: string[]
            onChangeCategory: (category: string) => void
            onChangeSubject: (subject: string) => void
            onChangeGrade: (grade: string) => void
            onDelete: () => void
        }
> = (props) => {
    const locale = useLocale()

    return (
        <>
            <Select
                value={props.category}
                onChange={(v) => props.onChangeCategory(v)}
                options={props.categoryList}
                getLabel={(option) => locale().SubjectCategory[option]}
                error={props.categoryError}
            />
            <Select
                value={props.subject}
                onChange={(v) => props.onChangeSubject(v)}
                options={props.subjectList}
                getLabel={(option) => locale().Subject[option]}
                error={props.subjectError}
            />
            <Select
                value={props.grade}
                onChange={(v) => props.onChangeGrade(v)}
                options={props.gradeList}
                getLabel={(option) => option}
                error={props.gradeError}
            />
            <div class={styles.deleteRow} onClick={() => props.onDelete()}>
                <IoClose />
            </div>
        </>
    )
}

export const ProfileForm: Component = () => {
    const data = useThisYearData()
    const locale = useLocale()
    const { activeProfile, updateProfile, deleteProfile } = useProfiles()
    const [isDeleting, setIsDeleting] = createSignal(false)

    const subjectLists = createMemo(() => data().subjectsByCategory)
    const categoryMap = createMemo(() => data().categoryMap)
    const gradeMap = createMemo(() => data().gradeMap)

    const getErrors = (subjects: SubjectRow[]) => {
        const output: RowErrors[] = Array.from({
            length: subjects.length,
        })
        const subjectMap: Record<string, number> = {}
        subjects.forEach(({ subject, grade }, index) => {
            const errors: RowErrors = {}
            errors.gradeError = !grade
            if (subjectMap[subject] !== undefined) {
                errors.subjectError = true
                output[subjectMap[subject]]!.subjectError = true
            } else {
                subjectMap[subject] = index
            }
            output[index] = errors
        })
        for (const [list1, list2] of data().conflictingSubjects) {
            for (const sub1 of list1) {
                if (subjectMap[sub1] !== undefined) {
                    for (const sub2 of list2) {
                        if (subjectMap[sub2] !== undefined) {
                            output[subjectMap[sub1]]!.subjectError = true
                            output[subjectMap[sub2]]!.subjectError = true
                        }
                    }
                }
            }
        }
        return output
    }

    const toSubjectRows = (subjects: Record<string, string>): SubjectRow[] => {
        return Object.entries(subjects).map(([subject, grade]): SubjectRow => {
            const category = categoryMap()[subject]!
            return {
                category,
                subject,
                subjectList: subjectLists()[category]!,
                grade,
                gradeList: gradeMap()[subject]!,
            }
        })
    }

    const getInitialEditing = () => {
        const profile = activeProfile()
        const subjects = toSubjectRows(profile.subjects)
        if (getErrors(subjects).some((x) => Object.values(x).some((x) => x))) {
            return {
                id: profile.id,
                subjects,
            }
        }
        return { id: "", subjects: [] }
    }

    const [editing, setEditing] = createStore<{
        id: string
        subjects: SubjectRow[]
    }>(getInitialEditing())

    createRenderEffect(() => {
        if (editing.id && activeProfile().id !== editing.id) {
            onEdit()
        }
    })

    const onEdit = () => {
        const profile = activeProfile()
        setEditing({
            id: profile.id,
            subjects: toSubjectRows(profile.subjects),
        })
    }

    const updateSubject = (subject: string, row: SubjectRow): SubjectRow => {
        const category = categoryMap()[subject]
        if (!category || row.category !== category) {
            return row
        }
        const gradeList = gradeMap()[subject]!
        if (gradeList !== row.gradeList) {
            return {
                ...row,
                subject,
                gradeList,
                grade: gradeList.includes(row.grade) ? row.grade : "",
            }
        }
        return { ...row, subject }
    }

    const updateCategory = (category: string, row: SubjectRow): SubjectRow => {
        if (row.category === category) return row
        const subject = subjectLists()[category]![0]!
        return {
            category,
            subject,
            subjectList: subjectLists()[category]!,
            grade: "",
            gradeList: gradeMap()[subject]!,
        }
    }

    const addSubject = () => {
        setEditing("subjects", (subjects) => {
            const category = data().defaultCategory
            const subject = subjectLists()[category]![0]!
            return [
                ...subjects,
                {
                    category,
                    subject,
                    subjectList: subjectLists()[category]!,
                    grade: "",
                    gradeList: gradeMap()[subject]!,
                },
            ]
        })
    }

    const errors = createMemo(() => getErrors(editing.subjects))

    const hasError = createMemo(() =>
        errors().some((x) => Object.values(x).some((x) => x)),
    )

    function onSave() {
        const profile: Profile = { id: editing.id, subjects: {} }
        for (const { subject, grade } of editing.subjects) {
            profile.subjects[subject] = grade
        }
        updateProfile(profile)
    }

    function onDelete() {
        deleteProfile(editing.id)
    }

    let deleteButton: HTMLDivElement
    let confirmDeleteButton: HTMLDivElement

    usePopup(
        () => deleteButton!,
        () => confirmDeleteButton!,
        isDeleting,
        { placement: "top" },
    )

    useClickAway(
        () => [deleteButton!, confirmDeleteButton!],
        () => setIsDeleting(false),
    )

    return (
        <>
            <ProfileSelector
                expanded={!!editing.id}
                onExpand={(expand) =>
                    expand ? onEdit() : setEditing("id", "")
                }
            />
            <Collapsable expanded={!!editing.id}>
                <div class={styles.subjects}>
                    <Index each={editing.subjects}>
                        {(item, index) => (
                            <ProfileRow
                                {...item()}
                                {...errors()[index]!}
                                onChangeCategory={(v) =>
                                    setEditing("subjects", index, (row) =>
                                        updateCategory(v, row),
                                    )
                                }
                                onChangeSubject={(v) =>
                                    setEditing("subjects", index, (row) =>
                                        updateSubject(v, row),
                                    )
                                }
                                onChangeGrade={(v) =>
                                    setEditing("subjects", index, "grade", v)
                                }
                                onDelete={() =>
                                    setEditing("subjects", (rows) =>
                                        rows.filter((_x, i) => i !== index),
                                    )
                                }
                                categoryList={data().categories}
                            />
                        )}
                    </Index>
                </div>
                <div class={styles.buttons}>
                    <Button class={styles.button} onClick={addSubject}>
                        {locale().UI.AddSubjectButton}
                    </Button>
                    <div class={styles.space} />
                    <div ref={deleteButton!}>
                        <Button
                            theme="error"
                            class={styles.button}
                            onClick={() => setIsDeleting(true)}
                        >
                            {locale().UI.DeleteButton}
                        </Button>
                        <Popup>
                            <div
                                ref={confirmDeleteButton!}
                                class={styles.deleteModal}
                            >
                                <Button
                                    theme="error"
                                    class={styles.button}
                                    onClick={onDelete}
                                >
                                    {locale().UI.ConfirmDeleteButton}
                                </Button>
                            </div>
                        </Popup>
                    </div>
                    <Button
                        class={styles.button}
                        disabled={hasError()}
                        onClick={onSave}
                    >
                        {locale().UI.SaveButton}
                    </Button>
                </div>
            </Collapsable>
        </>
    )
}
