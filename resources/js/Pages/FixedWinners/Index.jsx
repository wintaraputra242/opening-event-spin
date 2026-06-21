import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function FixedWinnersIndex({ fixedWinners }) {
  const { props } = usePage()
  const flash = props.flash || {}

  const [showDeleteModal, setShowDeleteModal] = useState(null)

  const handleDelete = (id) => {
    router.delete(`/fixed-winners/${id}`, {
      onSuccess: () => setShowDeleteModal(null),
    })
  }

  return (
    <AdminLayout title="Kupon Fix">

      {flash.success && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          {flash.success}
        </div>
      )}

      {/* Warning banner - ini menu sensitif */}
      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Halaman ini bersifat rahasia — tidak ditampilkan di menu navigasi. Tamu yang terdaftar di sini akan dijamin menang pada hadiah yang ditentukan.</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">

        <div className="px-6 pt-6 pb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Daftar Kupon Fix</h2>
            <p className="text-sm text-stone-400 mt-0.5">Tamu yang dipastikan menang untuk hadiah tertentu.</p>
          </div>
          <Link
            href="/fixed-winners/create"
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kupon Fix
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider w-12">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Nama Tamu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">No. Telp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Hadiah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {fixedWinners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-stone-400 text-sm">
                    Belum ada kupon fix yang didaftarkan.
                  </td>
                </tr>
              ) : fixedWinners.map((fw, index) => (
                <tr key={fw.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-6 py-4 text-sm text-stone-400">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-stone-800">{fw.guest?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{fw.guest?.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{fw.prize?.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    {fw.is_used
                      ? <span className="text-emerald-600 text-sm font-medium">Sudah Menang</span>
                      : <span className="text-amber-500 text-sm font-medium">Menunggu Undian</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowDeleteModal(fw)}
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
            <h3 className="text-base font-semibold text-stone-800 mb-1">Hapus Kupon Fix</h3>
            <p className="text-sm text-stone-500 mb-6">
              Yakin ingin menghapus kupon fix untuk <strong>{showDeleteModal.guest?.name}</strong>?
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