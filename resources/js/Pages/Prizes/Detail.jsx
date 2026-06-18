import { useForm, Link } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function PrizesCreate({prize}) {
  const { data, setData, put, processing, errors } = useForm({
    name: prize.name ?? '',
    description: prize.description ?? '',
    stock: prize.stock ?? 1,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put(`/prizes/${prize.id}`)
  }

  return (
    <AdminLayout title="Detail Hadiah">

      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/prizes"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Data Hadiah
        </Link>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">

          {/* Card Header */}
          <div className="px-6 py-5 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-800">Hadiah Baru</h2>
            <p className="text-sm text-stone-400 mt-0.5">Isi data hadiah yang akan disediakan pada event.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

            {/* Nama Hadiah */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nama Hadiah
              </label>
              <input
                type="text"
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                placeholder="Contoh: Kulkas 2 Pintu"
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

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Deskripsi
                <span className="ml-1.5 text-xs font-normal text-stone-400">(opsional)</span>
              </label>
              <textarea
                value={data.description}
                onChange={e => setData('description', e.target.value)}
                placeholder="Contoh: Kulkas 2 pintu merk Samsung, kapasitas 350L"
                rows={3}
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none resize-none',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  errors.description
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Stok */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Jumlah Stok
              </label>
              <div className="flex items-center gap-3">
                {/* Decrement */}
                <button
                  type="button"
                  onClick={() => setData('stock', Math.max(1, data.stock - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={data.stock}
                  onChange={e => setData('stock', Math.max(1, parseInt(e.target.value) || 1))}
                  className={[
                    'w-24 px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none text-center font-semibold',
                    'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                    errors.stock
                      ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                      : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                  ].join(' ')}
                />
                {/* Increment */}
                <button
                  type="button"
                  onClick={() => setData('stock', data.stock + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                Jumlah unit hadiah yang tersedia untuk diundi.
              </p>
              {errors.stock && (
                <p className="mt-1 text-xs text-red-500">{errors.stock}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/prizes"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-center no-underline"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Menyimpan...' : 'Simpan Hadiah'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}