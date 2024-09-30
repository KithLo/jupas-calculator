declare global {
    interface Settings {
        darkMode: boolean
    }

    type SubjectGrades = Record<string, string>
    type SubjectScores = Record<string, number>

    type Grade = {
        subjects: string[]
        grades: string[]
    }

    interface Data {
        subjects: string[]
        subjectsByCategory: Record<string, string[]>
        categories: string[]
        defaultCategory: string
        coreSubjects: string[]
        conflictingSubjects: [string[], string[]][]
        studyAreas: string[]
        institutions: string[]
        programmes: Record<string, Programme[]>
        grades: Grade[]
        year: string
        lastYear: string | null
        hasStats: boolean
        maxGrade: SubjectGrades
        gradeMap: Record<string, Grade["grades"]>
        categoryMap: Record<string, string>
        institutionMap: Record<string, string>
    }

    type Calculation = (input: SubjectScores) => SubjectScores | null

    interface Programme {
        id: string
        mapGrades: (grades: SubjectGrades) => SubjectScores
        requirement: Calculation
        weighting: Calculation
        studyAreas: string[]
        statistics: {
            UQ?: number
            M?: number
            LQ?: number
        }
    }

    interface Locale {
        Programme: Record<string, string>
        Institution: Record<string, string>
        StudyArea: Record<string, string>
        Subject: Record<string, string>
        SubjectCategory: Record<string, string>
        UI: Record<string, string>
    }

    interface Profile {
        id: string
        subjects: Record<string, string>
    }

    interface ResultRawRow extends Programme {
        institution: string
        maxScore?: number
    }

    interface ResultNamedRow {
        name: string
        institutionName: string
        url: string
    }

    interface ResultScoredRow {
        pass: boolean
        score?: string
        scores?: Record<string, number>
        lastYearScore?: string
        lastYearScores?: Record<string, number>
        deltas: {
            UQ?: number
            M?: number
            LQ?: number
        }
        statistics: Programme["statistics"]
    }

    interface ResultRow extends ResultRawRow, ResultNamedRow, ResultScoredRow {}
}

declare module "@tanstack/solid-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        filterColumnId?: string
    }
}

export {}
