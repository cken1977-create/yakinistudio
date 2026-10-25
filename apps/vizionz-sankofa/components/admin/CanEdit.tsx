'use client'

// VIZIONZ SANKOFA · "can this person change things here?" for staff screens
// The server page works out whether the signed-in role can create, edit or
// delete on that screen (using the same rules RLS enforces) and wraps the
// screen in <CanEditProvider>. Buttons that would only fail with a
// permission error (for example for Leadership, which is read-only) are
// hidden instead. RLS still decides on the server; this is just the UI.

import { createContext, useContext, type ReactNode } from 'react'

const CanEditContext = createContext<boolean>(true)

export function CanEditProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <CanEditContext.Provider value={value}>{children}</CanEditContext.Provider>
}

export function useCanEdit(): boolean {
  return useContext(CanEditContext)
}
