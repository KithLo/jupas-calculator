import { useSearchParams } from "@solidjs/router"
import {
    Accessor,
    createContext,
    createRenderEffect,
    createMemo,
    createResource,
    ParentComponent,
    useContext,
    Show,
} from "solid-js"
import { ulid } from "ulidx"
import { useThisYearData } from "./data"

const PREFIX = "profile_"
const STORE_NAME = "profiles"

const databases = new Map<string, Promise<IDBDatabase>>()

function getDatabaseId(year: string): string {
    return PREFIX + year
}

function upgradeDb(db: IDBDatabase) {
    db.createObjectStore(STORE_NAME, { keyPath: "id" })
}

async function openDatabase(year: string): Promise<IDBDatabase> {
    const exist = databases.get(year)
    if (exist) return exist
    const databaseId = getDatabaseId(year)
    const request = indexedDB.open(databaseId, 1)
    const promise = new Promise<IDBDatabase>((resolve, reject) => {
        request.onblocked = (ev) => console.error(ev)
        request.onupgradeneeded = (ev) => {
            const db: IDBDatabase = (ev.target as any).result
            upgradeDb(db)
        }
        request.onsuccess = () => {
            const db = request.result
            db.onclose = () => {
                databases.delete(year)
            }
            resolve(db)
        }
        request.onerror = reject
    })
    databases.set(year, promise)
    return promise
}

async function _listProfiles(year: string): Promise<Profile[]> {
    const db = await openDatabase(year)
    const txn = db.transaction([STORE_NAME], "readonly")
    const store = txn.objectStore(STORE_NAME)
    const req = store.getAll()
    return new Promise((resolve, reject) => {
        txn.onerror = reject
        req.onerror = reject
        req.onsuccess = () => {
            resolve(req.result)
        }
    })
}

async function _updateProfile(year: string, profile: Profile) {
    const db = await openDatabase(year)
    const txn = db.transaction([STORE_NAME], "readwrite")
    const store = txn.objectStore(STORE_NAME)
    store.put(profile)

    await new Promise((resolve, reject) => {
        txn.onerror = reject
        txn.oncomplete = resolve
    })
}

async function _deleteProfile(year: string, id: string) {
    const db = await openDatabase(year)
    const txn = db.transaction([STORE_NAME], "readwrite")
    const store = txn.objectStore(STORE_NAME)
    store.delete(id)

    await new Promise((resolve, reject) => {
        txn.onerror = reject
        txn.oncomplete = resolve
    })
}

const profileIdKey = "profileId"

interface ProfileData {
    profiles: Accessor<Profile[]>
    activeProfile: Accessor<Profile>
    createProfile: () => Promise<Profile>
    setActiveProfile: (profileId: string) => void
    updateProfile: (profile: Profile) => void
    deleteProfile: (profileId: string) => void
}

const Context = createContext<ProfileData>(undefined as unknown as ProfileData)

export const ProfileProvider: ParentComponent = (props) => {
    const data = useThisYearData()
    const [search, setSearch] = useSearchParams<{ [profileIdKey]: string }>()
    const [profiles, { refetch }] = createResource(
        () => data().year,
        _listProfiles,
        { initialValue: [] },
    )

    const setActiveProfile = (profileId: string) => {
        setSearch({ [profileIdKey]: profileId })
    }

    createRenderEffect(() => {
        if (profiles.state !== "ready") return
        const id = search[profileIdKey]
        const first = profiles()[0]
        if (!first) {
            createProfile()
        } else if (
            !id ||
            !profiles().find((profile) => profile.id === id) // no id or id not found
        ) {
            setSearch({ [profileIdKey]: first.id }, { replace: true })
        }
    })

    const activeProfile = createMemo(() => {
        const id = search[profileIdKey]
        if (!id) return null!
        return profiles().find((profile) => profile.id === id) ?? null!
    })

    const updateProfile = (profile: Profile) => {
        _updateProfile(data().year, profile).then(refetch)
    }

    const deleteProfile = (profileId: string) => {
        _deleteProfile(data().year, profileId).then(refetch)
    }

    const createProfile = () => {
        const profile: Profile = {
            id: ulid(),
            subjects: {},
        }
        for (const core of data().subjectsByCategory.core!) {
            profile.subjects[core] = ""
        }
        return _updateProfile(data().year, profile)
            .then(refetch)
            .then(() => setActiveProfile(profile.id))
            .then(() => profile)
    }

    return (
        <Show when={activeProfile()}>
            <Context.Provider
                value={{
                    profiles,
                    activeProfile,
                    setActiveProfile,
                    createProfile,
                    updateProfile,
                    deleteProfile,
                }}
            >
                {props.children}
            </Context.Provider>
        </Show>
    )
}

export function useProfiles() {
    return useContext(Context)
}
