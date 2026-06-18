import { useForm } from "@inertiajs/react"

export function PresenceModal({ guest, onClose }) {
  const { data, setData, put, processing, errors, reset } = useForm({
    name: guest.name ?? '',
    phone: guest.phone ?? '',
    office: guest.office ?? '',
    is_present: guest.is_present ?? false,
    code: guest.code ?? '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put(`/guests/${guest.id}`, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm mx-4 p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Update Kehadiran</h3>
            <p className="text-sm text-stone-500 mt-0.5">{guest.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Toggle is_present */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Status Kehadiran
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setData('is_present', !data.is_present)}
                className={[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none',
                  'focus:ring-2 focus:ring-stone-300 focus:ring-offset-1',
                  data.is_present ? 'bg-stone-900' : 'bg-stone-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                    data.is_present ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
              <span className="text-sm text-stone-600">
                {data.is_present ? 'Sudah hadir' : 'Belum hadir'}
              </span>
            </div>
          </div>

          {/* Input code — muncul hanya kalau is_present true */}
          {data.is_present ? (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Kode Undian
              </label>
              <input
                type="text"
                value={data.code}
                onChange={e => setData('code', e.target.value.toUpperCase())}
                placeholder="Contoh: ABCD001"
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none font-mono tracking-widest',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  errors.code
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              />
              {errors.code && (
                <p className="mt-1.5 text-xs text-red-500">{errors.code}</p>
              )}
            </div>
          ) : ''}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}