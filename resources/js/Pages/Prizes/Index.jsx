import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

function StatCard({ count, label, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-500',    text: 'text-blue-50',    sub: 'text-blue-100' },
    green:  { bg: 'bg-emerald-500', text: 'text-emerald-50', sub: 'text-emerald-100' },
    amber:  { bg: 'bg-amber-400',   text: 'text-amber-50',   sub: 'text-amber-100' },
    red:    { bg: 'bg-red-500',     text: 'text-red-50',     sub: 'text-red-100' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} rounded-2xl p-5 flex-1 min-w-0`}>
      <div className={`text-3xl font-bold ${c.text} leading-tight`}>{count} Item</div>
      <div className={`text-sm mt-1 ${c.sub}`}>{label}</div>
    </div>
  )
}

function StockBadge({ stock, isClaimed }) {
  if (isClaimed) {
    return <span className="text-stone-400 text-sm font-medium">Sudah Diklaim</span>
  }
  if (stock === 0) {
    return <span className="text-red-500 text-sm font-medium">Habis</span>
  }
  if (stock <= 3) {
    return <span className="text-amber-500 text-sm font-medium">Stok Menipis</span>
  }
  return <span className="text-emerald-600 text-sm font-medium">Tersedia</span>
}

const TAB_ALL       = 'all'
const TAB_AVAILABLE = 'available'
const TAB_LOW       = 'low'
const TAB_CLAIMED   = 'claimed'

export default function PrizesIndex({ prizes }) {
  const { props } = usePage()
  const flash = props.flash || {}

  const [activeTab, setActiveTab]       = useState(TAB_ALL)
  const [search, setSearch]             = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(null)

  const total     = prizes.length
  const available = prizes.filter(p => !p.is_claimed && p.stock > 3).length
  const low       = prizes.filter(p => !p.is_claimed && p.stock > 0 && p.stock <= 3).length
  const claimed   = prizes.filter(p => p.is_claimed || p.stock === 0).length

  const filtered = prizes.filter(p => {
    const matchSearch =
      search === '' ||
      [p.name, p.description].some(v => v?.toLowerCase().includes(search.toLowerCase()))

    if (!matchSearch) return false
    if (activeTab === TAB_AVAILABLE) return !p.is_claimed && p.stock > 3
    if (activeTab === TAB_LOW)       return !p.is_claimed && p.stock > 0 && p.stock <= 3
    if (activeTab === TAB_CLAIMED)   return p.is_claimed || p.stock === 0
    return true
  })

  const handleDelete = (id) => {
    router.delete(`/prizes/${id}`, {
      onSuccess: () => setShowDeleteModal(null),
    })
  }

  const tabs = [
    { key: TAB_ALL,       label: 'Semua',         count: total },
    { key: TAB_AVAILABLE, label: 'Tersedia',       count: available },
    { key: TAB_LOW,       label: 'Stok Menipis',   count: low },
    { key: TAB_CLAIMED,   label: 'Habis / Diklaim',count: claimed },
  ]

  return (
    <AdminLayout title="Data Hadiah">

      {/* Flash message */}
      {flash.success && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          {flash.success}
        </div>
      )}

      {/* Stat Cards */}
      <div className="flex gap-4 mb-8">
        <StatCard count={total}     label="Total hadiah tersedia"      color="blue" />
        <StatCard count={available} label="Hadiah masih tersedia"      color="green" />
        <StatCard count={low}       label="Hadiah stok menipis"        color="amber" />
        <StatCard count={claimed}   label="Hadiah habis atau diklaim"  color="red" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">

        {/* Table Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-stone-800">Daftar Hadiah</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari hadiah..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 w-56 bg-stone-50"
                />
              </div>
              {/* Add Button */}
              <Link
                href="/prizes/create"
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors no-underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Hadiah
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-stone-100">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.key
                    ? 'border-amber-400 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600',
                ].join(' ')}
              >
                {tab.label}
                <span className={[
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400',
                ].join(' ')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider w-12">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Nama Hadiah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-stone-400 text-sm">
                    {search ? `Tidak ada hadiah yang cocok dengan "${search}"` : 'Belum ada data hadiah.'}
                  </td>
                </tr>
              ) : filtered.map((prize, index) => (
                <tr key={prize.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-6 py-4 text-sm text-stone-400">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-stone-800">{prize.name}</td>
                  <td className="px-6 py-4 text-sm text-stone-500 max-w-xs truncate">
                    {prize.description ?? <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={[
                      'font-semibold text-sm px-2.5 py-1 rounded-lg',
                      prize.stock === 0
                        ? 'bg-red-50 text-red-500'
                        : prize.stock <= 3
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600',
                    ].join(' ')}>
                      {prize.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StockBadge stock={prize.stock} isClaimed={prize.is_claimed} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/prizes/${prize.id}`}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(prize)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-100 text-xs text-stone-400">
            Menampilkan {filtered.length} dari {prizes.length} hadiah
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-stone-800 mb-1">Hapus Hadiah</h3>
            <p className="text-sm text-stone-500 mb-6">
              Yakin ingin menghapus <strong>{showDeleteModal.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}