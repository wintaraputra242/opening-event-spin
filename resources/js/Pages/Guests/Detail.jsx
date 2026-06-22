import { useForm, Link } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function GuestsDetail({ guest }) {
  const { data, setData, put, processing, errors } = useForm({
    name: guest.name ?? '',
    phone: guest.phone ?? '',
    office: guest.office ?? '',
    status: guest.status ?? '',
    code: guest.code ?? '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put(`/guests/${guest.id}`)
  }

  return (
    <AdminLayout title="Detail Tamu">

      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/guests"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Data Tamu
        </Link>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">

          {/* Card Header */}
          <div className="px-6 py-5 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-800">Data Tamu Baru</h2>
            <p className="text-sm text-stone-400 mt-0.5">Isi seluruh data tamu undangan yang akan didaftarkan.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                placeholder="Contoh: Pak Wayan Merta"
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  errors.name
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* No. Telp */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={data.phone}
                onChange={e => setData('phone', e.target.value)}
                placeholder="Contoh: 081353300671"
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  errors.phone
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Perusahaan */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Perusahaan / Instansi
              </label>
              <input
                type="text"
                value={data.office}
                onChange={e => setData('office', e.target.value)}
                placeholder="Contoh: PT. CSM Corporatama"
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  errors.office
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              />
              {errors.office && (
                <p className="mt-1.5 text-xs text-red-500">{errors.office}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Status Kehadiran
              </label>

              <select
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
              >
                <option value="pending">Menunggu Konfirmasi</option>
                <option value="present">Hadir</option>
                <option value="absent">Tidak Hadir</option>
              </select>

              {errors.status && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.status}
                </p>
              )}
            </div>

            {/* Kode Undian */}
            {data.status === 'present' ? (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Kode Undian
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={data.code}
                    onChange={e => setData('code', e.target.value.toUpperCase())}
                    placeholder="Contoh: CAR1001"
                    className={[
                      'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none font-mono tracking-wider uppercase',
                      'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                      errors.code
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                    ].join(' ')}
                  />
                </div>
                <p className="mt-1.5 text-xs text-stone-400">
                  Kode akan otomatis diubah ke huruf kapital. Harus unik untuk setiap tamu.
                </p>
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code}</p>
                )}
              </div>
            ) : ''}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/guests"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-center no-underline"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Menyimpan...' : 'Simpan Tamu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}