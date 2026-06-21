import { useState } from 'react'
import { useForm, Link } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function FixedWinnersCreate({ prizes }) {
  const { data, setData, post, processing, errors } = useForm({
    phone: '',
    prize_id: '',
  })

  const [foundGuest, setFoundGuest] = useState(null)
  const [searching, setSearching]   = useState(false)
  const [searchError, setSearchError] = useState('')

  const handleSearch = async () => {
    if (!data.phone) return

    setSearching(true)
    setSearchError('')
    setFoundGuest(null)

    try {
      const csrfMeta = document.querySelector('meta[name="csrf-token"]')

      if (!csrfMeta) {
        setSearchError('CSRF meta tag tidak ditemukan di layout. Cek resources/views/app.blade.php')
        return
      }

      const res = await fetch('/fixed-winners/find-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfMeta.content,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone: data.phone }),
      })

      if (res.status === 419) {
        setSearchError('Sesi/CSRF token kadaluarsa (419). Refresh halaman lalu coba lagi.')
        return
      }

      if (!res.ok && res.status !== 404 && res.status !== 422) {
        const text = await res.text()
        console.error('Unexpected response:', res.status, text)
        setSearchError(`Server error (${res.status}). Cek console untuk detail.`)
        return
      }

      const result = await res.json()

      if (!result.success) {
        setSearchError(result.message)
        return
      }

      setFoundGuest(result.guest)
    } catch (err) {
      console.error('Fetch error:', err)
      setSearchError(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/fixed-winners')
  }

  return (
    <AdminLayout title="Tambah Kupon Fix">

      <div className="mb-6">
        <Link
          href="/fixed-winners"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Kupon Fix
        </Link>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">

          <div className="px-6 py-5 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-800">Daftarkan Kupon Fix</h2>
            <p className="text-sm text-stone-400 mt-0.5">Cari tamu berdasarkan nomor telepon, lalu tentukan hadiahnya.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

            {/* No. Telp + Search */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nomor Telepon Tamu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.phone}
                  onChange={e => {
                    setData('phone', e.target.value)
                    setFoundGuest(null)
                    setSearchError('')
                  }}
                  placeholder="Contoh: 081353300671"
                  className={[
                    'flex-1 px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                    'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                    errors.phone || searchError
                      ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                      : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || !data.phone}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searching ? 'Mencari...' : 'Cari Tamu'}
                </button>
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>
              )}
              {searchError && (
                <p className="mt-1.5 text-xs text-red-500">{searchError}</p>
              )}
            </div>

            {/* Hasil pencarian tamu */}
            {foundGuest && (
              <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium mb-1">Tamu Ditemukan</p>
                <p className="text-sm font-semibold text-stone-800">{foundGuest.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {foundGuest.office} {foundGuest.code && <>· Kode: <span className="font-mono">{foundGuest.code}</span></>}
                </p>
              </div>
            )}

            {/* Pilih Hadiah */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Hadiah
              </label>
              <select
                value={data.prize_id}
                onChange={e => setData('prize_id', e.target.value)}
                disabled={!foundGuest}
                className={[
                  'w-full px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                  'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  errors.prize_id
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              >
                <option value="">-- Pilih hadiah --</option>
                {prizes.map(prize => (
                  <option key={prize.id} value={prize.id}>
                    {prize.name} (stok: {prize.stock})
                  </option>
                ))}
              </select>
              {!foundGuest && (
                <p className="mt-1.5 text-xs text-stone-400">Cari tamu terlebih dahulu untuk memilih hadiah.</p>
              )}
              {errors.prize_id && (
                <p className="mt-1.5 text-xs text-red-500">{errors.prize_id}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/fixed-winners"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-center no-underline"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing || !foundGuest || !data.prize_id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Menyimpan...' : 'Simpan Kupon Fix'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}