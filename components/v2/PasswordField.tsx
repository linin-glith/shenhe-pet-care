'use client';

/**
 * The password field, with a way to see what is typed and a way to copy it.
 *
 * WHY THE EYE TOGGLE
 * A masked field cannot be checked by the person filling it in. When a
 * sign-in fails and the field shows dots, the person cannot tell a wrong
 * password from a wrong password character, from a password manager that
 * filled in something else, or from a keyboard layout that produced a
 * different letter. Every one of those looks identical on the screen.
 *
 * The toggle removes that ambiguity: the person can look at what they
 * typed and see whether it is what they meant.
 *
 * WHY THE COPY BUTTON
 * The same argument, for the case where the password was never typed at
 * all — it was set by an administrator and handed over, and the person is
 * pasting it from a message. Pasting is exact; retyping is not.
 *
 * WHY IT IS A COMPONENT AND NOT A FRAGMENT OF EACH FORM
 * The portal and the desk are separate surfaces with separate styling, but
 * the behaviour is identical. Two copies of the same toggle would drift.
 *
 * WHY THE BUTTONS ARE NOT INSIDE THE FIELD
 * A button inside the field competes with the caret for the click and can
 * swallow a keystroke at the end of the string. The buttons sit beside the
 * label instead, where they cannot interfere with typing.
 */

import { useState } from 'react';

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  variant = 'light',
  placeholder,
  hint,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  variant?: 'light' | 'dark';
  placeholder?: string;
  hint?: string;
}) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const dark = variant === 'dark';
  const labelClass = dark
    ? 'text-xs font-semibold text-v2-ink-300'
    : 'block text-sm font-semibold text-v2-ink-800';
  const inputClass = dark
    ? 'mt-1.5 w-full rounded-lg border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-v2-ink-300 focus:border-v2-accent-500 focus:bg-white/8'
    : 'mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-2.5 text-sm outline-none transition focus:border-v2-accent-500 focus:ring-2 focus:ring-v2-accent-100';

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // The clipboard is not always available — an insecure origin, or a
      // browser that refuses without a gesture. Nothing to recover from:
      // the eye toggle is right there.
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <div className="flex items-center gap-3">
          {value.length > 0 && (
            <button
              type="button"
              onClick={copy}
              className={
                dark
                  ? 'text-[11px] font-semibold text-v2-ink-300 transition-colors hover:text-white'
                  : 'text-[11px] font-semibold text-v2-ink-400 transition-colors hover:text-v2-accent-700'
              }
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-pressed={shown}
            className={
              dark
                ? 'text-[11px] font-semibold text-v2-ink-300 transition-colors hover:text-white'
                : 'text-[11px] font-semibold text-v2-ink-400 transition-colors hover:text-v2-accent-700'
            }
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <input
        id={id}
        name={name}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />

      {hint && (
        <p className={dark ? 'mt-1.5 text-[11px] text-v2-ink-300' : 'mt-1.5 text-[11px] text-v2-ink-500'}>
          {hint}
        </p>
      )}
    </div>
  );
}
