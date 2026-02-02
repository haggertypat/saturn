"use client"

import { useEffect, useState } from "react"

const PIN_CODE = "2727"
const STORAGE_KEY = "saturn:pin-unlock-at"
const SESSION_KEY = "saturn:pin-unlocked"
const UNLOCK_DURATION_MS = 1000 * 60 * 30

type PinGateProps = {
  children: React.ReactNode
}

export default function PinGate({ children }: PinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [checked, setChecked] = useState(false)

  const evaluateUnlockStatus = () => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const storedTimestamp = stored ? Number(stored) : NaN
    const sessionUnlocked = window.sessionStorage.getItem(SESSION_KEY) === "true"
    if (Number.isFinite(storedTimestamp) && sessionUnlocked) {
      const age = Date.now() - storedTimestamp
      if (age < UNLOCK_DURATION_MS) {
        setIsUnlocked(true)
        return
      }
    }
    setIsUnlocked(false)
  }

  useEffect(() => {
    evaluateUnlockStatus()
    setChecked(true)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        evaluateUnlockStatus()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isUnlocked) {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    const storedTimestamp = stored ? Number(stored) : NaN
    const remainingMs = Number.isFinite(storedTimestamp)
      ? UNLOCK_DURATION_MS - (Date.now() - storedTimestamp)
      : 0

    if (remainingMs <= 0) {
      setIsUnlocked(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(false)
    }, remainingMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isUnlocked])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pin === PIN_CODE) {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
      window.sessionStorage.setItem(SESSION_KEY, "true")
      setIsUnlocked(true)
      setError("")
      setPin("")
      return
    }
    setError("Incorrect PIN. Try again.")
  }

  if (!checked) {
    return null
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-xl font-semibold">Enter PIN to continue</h1>
        <p className="mt-2 text-sm text-slate-400">
          This unlock lasts 30 minutes and resets when the tab is closed.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-300" htmlFor="pin">
              PIN
            </label>
            <input
              id="pin"
              inputMode="numeric"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-lg tracking-[0.3em] text-slate-100 outline-none ring-0 focus:border-slate-500"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(event) => {
                setPin(event.target.value)
                if (error) {
                  setError("")
                }
              }}
              placeholder="••••"
              type="password"
            />
            {error ? (
              <p className="mt-2 text-sm text-rose-400">{error}</p>
            ) : null}
          </div>
          <button
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            type="submit"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}
