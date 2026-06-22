import { useState } from 'react'
import { useForm, Link } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function FixedWinnersCreate({ prizes }) {
  const { data, setData, post, processing, errors } = useForm({
    phone: '',      // tetap field 'phone' untuk dikirim ke store(), tapi diisi dari pilihan tamu
    prize_id: '',
  })

  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])  // list tamu dari hasil pencarian
  const [foundGuest, setFoundGuest]     = useState(null)  // tamu yang dipilih admin
  const [searching, setSearching]       = useState(false)
  const [searchError, setSearchError]   = useState('')

  const handleSearch = async () => {
    // if (!searchQuery || searchQuery.trim().length < 2) {
    //   setSearchError('Masukkan minimal 2 karakter untuk mencari.')
    //   return
    // }

    setSearching(true)
    setSearchError('')
    setSearchResults([])  
    setFoundGuest(null)
    setData('phone', '')

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
        body: JSON.stringify({ query: searchQuery.trim() }),
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

      setSearchResults(result.guests)
    } catch (err) {
      console.error('Fetch error:', err)
      setSearchError(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectGuest = (guest) => {
    if (guest.fixed_for) return // sudah terdaftar, tidak bisa dipilih

    setFoundGuest(guest)
    setData('phone', guest.phone) // kirim phone ke backend store() untuk resolve guest_id
    setSearchResults([])
  }

  const handleClearGuest = () => {
    setFoundGuest(null)
    setData('phone', '')
    setData('prize_id', '')
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
            <p className="text-sm text-stone-400 mt-0.5">Cari tamu berdasarkan nama atau nomor telepon, lalu tentukan hadiahnya.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

            {/* Search Input */}
            {!foundGuest ? (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Cari Tamu
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setSearchError('')
                      if (searchResults.length) setSearchResults([])
                    }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    placeholder="Nama tamu atau nomor telepon..."
                    className={[
                      'flex-1 px-4 py-2.5 text-sm rounded-xl border transition-colors outline-none',
                      'focus:ring-2 focus:ring-stone-300 focus:border-stone-400',
                      searchError
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300',
                    ].join(' ')}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {searching ? 'Mencari...' : 'Cari'}
                  </button>
                </div>

                {searchError && (
                  <p className="mt-1.5 text-xs text-red-500">{searchError}</p>
                )}

                <p className="mt-1.5 text-xs text-stone-400">
                  Bisa dicari by nama (contoh: "Budi") atau nomor telepon (contoh: "08135...")
                </p>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                    {searchResults.map(guest => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => handleSelectGuest(guest)}
                        disabled={!!guest.fixed_for}
                        className={[
                          'w-full text-left px-4 py-3 transition-colors',
                          guest.fixed_for
                            ? 'bg-stone-50 opacity-60 cursor-not-allowed'
                            : 'hover:bg-amber-50 cursor-pointer',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{guest.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">
                              {guest.phone}
                              {guest.office && ` · ${guest.office}`}
                              {guest.code && <> · <span className="font-mono">{guest.code}</span></>}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {guest.fixed_for ? (
                              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-lg">
                                Fix: {guest.fixed_for}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                Pilih →
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Tamu sudah dipilih — tampilkan info + tombol ganti */
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Tamu Terpilih
                </label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Tamu Dipilih</p>
                    <p className="text-sm font-semibold text-stone-800">{foundGuest.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {foundGuest.phone}
                      {foundGuest.office && ` · ${foundGuest.office}`}
                      {foundGuest.code && <> · Kode: <span className="font-mono">{foundGuest.code}</span></>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearGuest}
                    className="text-xs text-stone-400 hover:text-stone-600 transition-colors shrink-0 mt-0.5"
                  >
                    Ganti
                  </button>
                </div>
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
                <p className="mt-1.5 text-xs text-stone-400">Cari dan pilih tamu terlebih dahulu.</p>
              )}
              {errors.prize_id && (
                <p className="mt-1.5 text-xs text-red-500">{errors.prize_id}</p>
              )}
            </div>

            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}

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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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