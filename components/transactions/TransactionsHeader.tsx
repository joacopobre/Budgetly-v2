'use client'

import { Plus, Upload } from 'lucide-react'

type Props = {
  onAdd: () => void
  onImport: () => void
}

export function TransactionsHeader({ onAdd, onImport }: Props) {
  return (
    <div className="bl-head bl-rise">
      <h1 className="bl-h1">Transactions</h1>
      <div className="flex items-center gap-2.5">
        <button type="button" className="bl-btn bl-btn--sm bl-btn--outline" onClick={onImport}>
          <Upload aria-hidden="true" />
          Import CSV
        </button>
        <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={onAdd}>
          <Plus aria-hidden="true" />
          Add transaction
        </button>
      </div>
    </div>
  )
}
