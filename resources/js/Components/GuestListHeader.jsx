import { useRef, useState } from 'react'
import { Link, router } from '@inertiajs/react'

// Taruh ini di dalam komponen Index, ganti bagian header yang lama

export function GuestListHeader({ search, setSearch }) {
  const fileInputRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)

    router.post('/guests/import', { file }, {
      forceFormData: true,
      onFinish: () => {
        setImporting(false)
        fileInputRef.current.value = ''
      },
    })
  }

  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-semibold text-stone-800">Tamu Undangan</h2>

      <div className="flex items-center gap-2">

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari tamu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 w-52 bg-stone-50"
          />
        </div>

        {/* Download Template */}
        <a
          href="/guests/export-template"
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors no-underline"
          title="Download template Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Template
        </a>

        {/* Import Excel */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Import dari Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {importing ? 'Mengimport...' : 'Import'}
        </button>

        {/* Tambah Tamu */}
        <Link
          href="/guests/create"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Tamu
        </Link>
      </div>
    </div>
  )
}