import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'
import { GuestListHeader } from '@/Components/GuestListHeader'
import { PresenceModal } from '@/Components/PresenceModal'

const STATUS_ALL = 'all'
const STATUS_PENDING = 'pending'
const STATUS_PRESENT = 'present'
const STATUS_ABSENT = 'absent'

function StatCard({ count, label, color }) {
  const colors = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-50', sub: 'text-blue-100' },
    yellow: { bg: 'bg-amber-400', text: 'text-amber-50', sub: 'text-amber-100' },
    green: { bg: 'bg-emerald-500', text: 'text-emerald-50', sub: 'text-emerald-100' },
    red: { bg: 'bg-red-500', text: 'text-red-50', sub: 'text-red-100' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} rounded-2xl p-5 flex-1 min-w-0`}>
      <div className={`text-3xl font-bold ${c.text} leading-tight`}>{count} Orang</div>
      <div className={`text-sm mt-1 ${c.sub}`}>{label}</div>
    </div>
  )
}

function StatusBadge({ guest }) {
  if (!guest.is_present && !guest.code) {
    return <span className="text-amber-500 text-sm font-medium">Menunggu Konfirmasi</span>
  }
  if (guest.is_present) {
    return <span className="text-emerald-600 text-sm font-medium">Konfirmasi Hadir</span>
  }
  return <span className="text-red-500 text-sm font-medium">Konfirmasi Tidak Hadir</span>
}

export default function GuestsIndex({ guests }) {
  const { props } = usePage()
  const flash = props.flash || {}

  const [activeTab, setActiveTab] = useState(STATUS_ALL)
  const [search, setSearch] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(null)

  const totalGuests = guests.length
  const pending = guests.filter(g => !g.is_present && !g.code).length
  const present = guests.filter(g => g.is_present).length
  const absent = guests.filter(g => !g.is_present && g.code).length

  const filtered = guests.filter(g => {
    const matchSearch = search === '' || [g.name, g.phone, g.office, g.code]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))

    if (!matchSearch) return false
    if (activeTab === STATUS_PENDING) return !g.is_present && !g.code
    if (activeTab === STATUS_PRESENT) return g.is_present
    if (activeTab === STATUS_ABSENT) return !g.is_present && g.code
    return true
  })

  const handleDelete = (id) => {
    router.delete(`/guests/${id}`, {
      onSuccess: () => setShowDeleteModal(null),
    })
  }

  const tabs = [
    { key: STATUS_ALL, label: 'Semua', count: totalGuests },
    { key: STATUS_PENDING, label: 'Menunggu Konfirmasi', count: pending },
    { key: STATUS_PRESENT, label: 'Hadir', count: present },
    // { key: STATUS_ABSENT, label: 'Tidak Hadir', count: absent },
  ]

  const [showPresenceModal, setShowPresenceModal] = useState(null)

  return (
    <AdminLayout title="Data Tamu">

      {/* Flash message */}
      {flash.success && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          {flash.success}
        </div>
      )}

      {/* Stat Cards */}
      <div className="flex gap-4 mb-8">
        <StatCard count={totalGuests} label="Jumlah total tamu undangan" color="blue" />
        <StatCard count={pending} label="Jumlah menunggu konfirmasi" color="yellow" />
        <StatCard count={present} label="Jumlah tamu hadir" color="green" />
        <StatCard count={absent} label="Jumlah tamu tidak hadir" color="red" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">

        {/* Table Header */}
        <div className="px-6 pt-6 pb-0">
          <GuestListHeader search={search} setSearch={setSearch} />

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
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">No. Telp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Perusahaan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Status Tamu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Kode Undian</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-stone-400 text-sm">
                    {search ? `Tidak ada tamu yang cocok dengan "${search}"` : 'Belum ada data tamu.'}
                  </td>
                </tr>
              ) : filtered.map((guest, index) => (
                <tr key={guest.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-6 py-4 text-sm text-stone-400">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-stone-800">{guest.name}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{guest.phone}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{guest.office}</td>
                  <td className="px-6 py-4">
                    <StatusBadge guest={guest} />
                  </td>
                  <td className="px-6 py-4">
                    {guest.code
                      ? <span className="font-mono text-sm font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">{guest.code}</span>
                      : <span className="text-stone-300 text-sm">—</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/guests/${guest.id}`}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setShowPresenceModal(guest)}
                        className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Update Kehadiran"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(guest)}
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
            Menampilkan {filtered.length} dari {guests.length} tamu
          </div>
        )}
      </div>

      {showPresenceModal && (
        <PresenceModal
          guest={showPresenceModal}
          onClose={() => setShowPresenceModal(null)}
        />
      )}

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
            <h3 className="text-base font-semibold text-stone-800 mb-1">Hapus Tamu</h3>
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