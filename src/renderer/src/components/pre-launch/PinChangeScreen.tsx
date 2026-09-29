import React, { useState } from 'react'

type Props = {
  /** Row the main process issued the upgrade grant for. */
  source: 'admin' | 'employee' | 'roster'
  id: number
  message?: string
  onComplete: () => void
  onCancel: () => void | Promise<void>
}

const PIN_LENGTH = 6

/**
 * Forced PIN replacement for accounts created before the 6-digit rule.
 *
 * These accounts still hold a shorter PIN (pinLength is NULL in the database).
 * Login verifies it and then hands control here, so the app stays gated until a
 * new 6-digit PIN is committed. The new PIN is written through `setOwnPin`,
 * which is authorised by a single-use grant scoped to this exact account.
 */
export default function PinChangeScreen({ source, id, message, onComplete, onCancel }: Props) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const pinValid = /^\d{6}$/.test(pin)
  const confirmValid = /^\d{6}$/.test(confirm)
  const mismatch = confirm.length > 0 && pin !== confirm
  const canSubmit = pinValid && confirmValid && !mismatch && !busy

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setBusy(true)
    try {
      const result = await window.api.setOwnPin(source, id, pin, confirm)
      if (result?.success) {
        onComplete()
      } else {
        setError(result?.error || 'Could not update your PIN. Please try again.')
        setBusy(false)
      }
    } catch {
      setError('Could not update your PIN. Please try again.')
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    await onCancel()
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-white/20 outline-none transition focus:border-white/30 focus:bg-white/10'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0B0F] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Create your new PIN</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {message ||
              `For your security, your PIN now must be exactly ${PIN_LENGTH} digits. Choose a new one to continue.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-pin" className="mb-2 block text-sm text-white/60">
              New PIN
            </label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(e) => {
                // Digits only: strip anything else so the field can never hold a
                // value the main process would reject.
                const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
                setPin(next);
                setError('');
              }}
              placeholder={'•'.repeat(PIN_LENGTH)}
              className={inputClass}
              autoFocus
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="confirm-pin" className="mb-2 block text-sm text-white/60">
              Confirm new PIN
            </label>
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={confirm}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
                setConfirm(next);
                setError('');
              }}
              placeholder={'•'.repeat(PIN_LENGTH)}
              className={inputClass}
              disabled={busy}
            />
          </div>

          {mismatch && (
            <p className="text-center text-sm text-amber-400">The two PINs do not match.</p>
          )}
          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0B0B0F] transition enabled:hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {busy ? 'Saving…' : 'Save and continue'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={busy || cancelling}
            className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/60 transition hover:border-white/20 hover:text-white/80 disabled:opacity-30"
          >
            {cancelling ? 'Signing out…' : 'Cancel and sign out'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          You will sign in with this new PIN from now on.
        </p>
      </div>
    </div>
  )
}
