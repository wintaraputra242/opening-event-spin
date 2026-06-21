import { useState, useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import AdminLayout from '@/Layouts/AdminLayout'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Slot Reel ────────────────────────────────────────────────────────────────

function SlotReel({ value, spinning }) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const [display, setDisplay] = useState(value)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (spinning) {
      intervalRef.current = setInterval(() => {
        setDisplay(chars[Math.floor(Math.random() * chars.length)])
      }, 60)
    } else {
      clearInterval(intervalRef.current)
      setDisplay(value)
    }
    return () => clearInterval(intervalRef.current)
  }, [spinning, value])

  return (
    <div className={[
      'w-14 h-20 flex items-center justify-center rounded-xl text-3xl font-bold font-mono transition-all duration-150',
      spinning
        ? 'bg-amber-400 text-stone-900 shadow-lg shadow-amber-200 scale-105'
        : 'bg-stone-800 text-amber-400',
    ].join(' ')}>
      {display}
    </div>
  )
}

// ─── Winner Card Modal ────────────────────────────────────────────────────────

function WinnerCard({ winner, prize, onNext, isBulk = false, bulkWinners = [], bulkIndex = 0 }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 text-center"
        style={{ animation: 'fadeInScale 0.4s ease' }}>

        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🏆</span>
        </div>

        {isBulk && (
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
            Pemenang {bulkIndex + 1} dari {bulkWinners.length}
          </p>
        )}

        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">
          Selamat! Pemenang Undian
        </p>
        <h2 className="text-2xl font-bold text-stone-800 mb-1">{winner.name}</h2>
        {winner.office && <p className="text-sm text-stone-400 mb-1">{winner.office}</p>}

        <div className="inline-block mt-3 mb-5 px-4 py-2 bg-stone-100 rounded-xl">
          <span className="text-xs text-stone-400 block mb-0.5">Kode Undian</span>
          <span className="font-mono text-lg font-bold text-stone-700 tracking-widest">{winner.code}</span>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6">
          <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider mb-1">Hadiah</p>
          <p className="text-lg font-bold text-stone-800">{prize.name}</p>
          {prize.description && (
            <p className="text-sm text-stone-400 mt-0.5">{prize.description}</p>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full px-4 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
        >
          {isBulk && bulkIndex < bulkWinners.length - 1 ? `Lihat Pemenang Berikutnya →` : 'Selesai'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LotteryIndex({ guests, prizes, results: initialResults }) {
  const { props } = usePage()
  const csrfToken = props.ziggy?.csrf ?? document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''

  const eligibleGuests = guests.filter(g => g.is_present && g.code)
  // const availablePrizes = prizes.filter(p => !p.is_claimed && p.stock > 0)

  // ── State ──
  const [selectedPrize, setSelectedPrize] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [reelValue, setReelValue] = useState('-------')
  const [winner, setWinner] = useState(null)
  const [history, setHistory] = useState(initialResults || [])
  const [mode, setMode] = useState('single') // 'single' | 'bulk'
  const [error, setError] = useState(null)
  const [localPrizes, setLocalPrizes] = useState(prizes)
  const [bulkSpinning, setBulkSpinning] = useState(false)

  const availablePrizes = localPrizes.filter(p => !p.is_claimed && p.stock > 0)

  // Bulk mode
  const [bulkWinners, setBulkWinners] = useState([])
  const [bulkIndex, setBulkIndex] = useState(0)
  const [showBulkModal, setShowBulkModal] = useState(false)

  const spinPoolRef = useRef([])
  const currentIdxRef = useRef(0)
  const reelIntervalRef = useRef(null)
  const autoStopRef = useRef(null)

  // ── SINGLE MODE: Start spin (auto stop 4-5 detik) ──
  const handleStart = () => {
    if (!selectedPrize || spinning || eligibleGuests.length === 0) return
    setError(null)

    // Exclude tamu yang sudah ada di history
    const wonGuestIds = history.map(r => r.guest_id ?? r.guest?.id)
    const pool = shuffle(eligibleGuests.filter(g => !wonGuestIds.includes(g.id)))

    if (pool.length === 0) {
      setError('Tidak ada tamu eligible tersisa.')
      return
    }

    spinPoolRef.current = pool
    currentIdxRef.current = 0

    setSpinning(true)

    // Rolling kode tamu di reel
    reelIntervalRef.current = setInterval(() => {
      const g = spinPoolRef.current[currentIdxRef.current % spinPoolRef.current.length]
      setReelValue(g.code)
      currentIdxRef.current++
    }, 80)

    // Auto stop 4-5 detik
    const duration = 4000 + Math.random() * 1000
    autoStopRef.current = setTimeout(() => {
      handleStop(pool)
    }, duration)
  }

  const decrementPrizeStock = (prizeId) => {
    setLocalPrizes(prev => prev.map(p => {
      if (p.id !== prizeId) return p
      const newStock = p.stock - 1
      return { ...p, stock: newStock, is_claimed: newStock <= 0 }
    }))
  }

  // ── SINGLE MODE: Stop spin ──
  const handleStop = (pool) => {
    clearInterval(reelIntervalRef.current)
    clearTimeout(autoStopRef.current)
    setSpinning(false)

    // Reel position di sini HANYA untuk efek visual selagi menunggu response backend.
    // Backend (LotteryController::pick) yang menentukan pemenang sebenarnya
    // (termasuk logika kupon fix), jadi kita TIDAK BOLEH percaya posisi reel
    // sebagai hasil akhir.
    const activePool = pool ?? spinPoolRef.current
    const idx = (currentIdxRef.current - 1 + activePool.length) % activePool.length
    const visualGuest = activePool[idx]

    setReelValue(visualGuest.code) // sementara, akan ditimpa begitu response datang

    // Kirim ke backend — backend yang menentukan pemenang aktual
    fetch('/lottery/pick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': decodeURIComponent(
          document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
        ),
      },
      body: JSON.stringify({
        prize_id: selectedPrize.id,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          setError(data.message)
          // reset reel karena spin ini tidak menghasilkan pemenang
          setReelValue('-------')
          return
        }

        // ✅ PENTING: pakai data.guest dari backend sebagai sumber kebenaran,
        // bukan visualGuest hasil reel lokal — supaya kupon fix / pemenang
        // sebenarnya yang tampil, bukan tamu hasil shuffle reel di frontend.
        const actualWinner = data.guest

        setReelValue(actualWinner.code)
        decrementPrizeStock(selectedPrize.id)
        setWinner(actualWinner)
        setHistory(prev => [{
          guest: actualWinner,
          prize: selectedPrize,
          guest_id: actualWinner.id,
          won_at: new Date().toISOString(),
        }, ...prev])
      })
      .catch(() => setError('Terjadi kesalahan saat menyimpan hasil undian.'))
  }

  // ── Manual stop (klik tombol stop) ──
  const handleManualStop = () => {
    if (!spinning) return
    clearTimeout(autoStopRef.current)
    handleStop(spinPoolRef.current)
  }

  // ── BULK MODE: Spin semua stok sekaligus ──
  const handleBulkSpin = () => {
    if (!selectedPrize || spinning || bulkSpinning) return
    setError(null)
    setBulkSpinning(true)

    // Jalankan animasi reel dulu 4-5 detik, baru fetch ke backend
    spinPoolRef.current = shuffle(eligibleGuests)
    currentIdxRef.current = 0

    reelIntervalRef.current = setInterval(() => {
      const g = spinPoolRef.current[currentIdxRef.current % spinPoolRef.current.length]
      setReelValue(g.code)
      currentIdxRef.current++
    }, 80)

    const duration = 4000 + Math.random() * 1000
    setTimeout(() => {
      clearInterval(reelIntervalRef.current)
      setBulkSpinning(false)
      setReelValue('-------')

      fetch('/lottery/bulk-pick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
          ),
        },
        body: JSON.stringify({ prize_id: selectedPrize.id }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) {
            setError(data.message)
            return
          }
          setLocalPrizes(prev => prev.map(p => {
            if (p.id !== selectedPrize.id) return p
            const newStock = p.stock - data.winners.length
            return { ...p, stock: newStock < 0 ? 0 : newStock, is_claimed: newStock <= 0 }
          }))
          setBulkWinners(data.winners)
          setBulkIndex(0)
          setShowBulkModal(true)
          setHistory(prev => [
            ...data.winners.map(w => ({
              guest: w.guest,
              prize: selectedPrize,
              guest_id: w.guest.id,
              won_at: new Date().toISOString(),
            })),
            ...prev,
          ])
        })
        .catch(() => setError('Terjadi kesalahan saat bulk spin.'))
    }, duration)
  }

  const handleReset = () => {
    setWinner(null)
    setSelectedPrize(null)
    setReelValue('-------')
  }

  const handleBulkNext = () => {
    if (bulkIndex < bulkWinners.length - 1) {
      setBulkIndex(i => i + 1)
    } else {
      setShowBulkModal(false)
      setBulkWinners([])
      setSelectedPrize(null)
      setReelValue('-------')
    }
  }

  const reelChars = reelValue.padEnd(7, ' ').split('').slice(0, 7)

  return (
    <AdminLayout title="Undian">

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: Control Panel ── */}
        <div className="xl:col-span-1 space-y-5">

          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Mode Undian</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('single')}
                disabled={spinning}
                className={[
                  'px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  mode === 'single'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300',
                ].join(' ')}
              >
                🎯 Sekali
              </button>
              <button
                onClick={() => setMode('bulk')}
                disabled={spinning}
                className={[
                  'px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  mode === 'bulk'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300',
                ].join(' ')}
              >
                ⚡ Sekaligus
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              {mode === 'single'
                ? 'Spin satu pemenang per klik. Auto stop dalam 4–5 detik.'
                : 'Semua stok hadiah diundi sekaligus dalam satu klik.'}
            </p>
          </div>

          {/* Pilih Hadiah */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-800">Pilih Hadiah</h3>
              <p className="text-xs text-stone-400 mt-0.5">Tentukan hadiah sebelum spin dimulai</p>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {availablePrizes.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">Semua hadiah sudah habis.</p>
              ) : availablePrizes.map(prize => (
                <button
                  key={prize.id}
                  onClick={() => !spinning && setSelectedPrize(prize)}
                  disabled={spinning}
                  className={[
                    'w-full text-left px-4 py-3 rounded-xl border transition-all',
                    selectedPrize?.id === prize.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50',
                    spinning ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-800">{prize.name}</span>
                    <span className={[
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      prize.stock <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600',
                    ].join(' ')}>
                      {prize.stock} unit
                    </span>
                  </div>
                  {prize.description && (
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{prize.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info tamu eligible */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-400">Tamu Peserta Undian</p>
                <p className="text-2xl font-bold text-stone-800 mt-0.5">{eligibleGuests.length} Orang</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-2">Tamu hadir & memiliki kode undian</p>
          </div>
        </div>

        {/* ── CENTER: Slot Machine + Table ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Slot Machine */}
          <div className="bg-stone-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Event Opening</p>
              <h1 className="text-2xl font-bold text-white">Spin Undian Berhadiah</h1>
            </div>

            <div className="mx-8 mb-6 px-5 py-3 bg-stone-800 rounded-xl text-center">
              {selectedPrize ? (
                <>
                  <p className="text-xs text-stone-400 mb-0.5">Hadiah yang Diundi</p>
                  <p className="text-lg font-bold text-amber-400">{selectedPrize.name}</p>
                  {mode === 'bulk' && (
                    <>
                      <div className="flex items-center justify-center gap-2 px-8 py-6">
                        {reelChars.map((char, i) => (
                          char.trim() === ''
                            ? <div key={i} className="w-3" />
                            : <SlotReel key={i} value={char} spinning={bulkSpinning} />
                        ))}
                      </div>
                      <div className="text-center pb-4">
                        <p className={['text-sm font-medium transition-colors', bulkSpinning ? 'text-amber-400' : 'text-stone-500'].join(' ')}>
                          {bulkSpinning ? 'Mengundi semua pemenang...' : selectedPrize ? `Siap mengundi ${selectedPrize.stock} pemenang` : 'Pilih hadiah untuk memulai'}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone-500">— Pilih hadiah terlebih dahulu —</p>
              )}
            </div>

            {/* Reels — hanya tampil di mode single */}
            {mode === 'single' && (
              <>
                <div className="flex items-center justify-center gap-2 px-8 py-6">
                  {reelChars.map((char, i) => (
                    char.trim() === ''
                      ? <div key={i} className="w-3" />
                      : <SlotReel key={i} value={char} spinning={spinning} />
                  ))}
                </div>
                <div className="text-center pb-4">
                  <p className={['text-sm font-medium transition-colors', spinning ? 'text-amber-400' : 'text-stone-500'].join(' ')}>
                    {spinning ? 'Mengundi...' : selectedPrize ? 'Siap untuk diundi' : 'Pilih hadiah untuk memulai'}
                  </p>
                </div>
              </>
            )}

            {/* Bulk mode placeholder */}
            {mode === 'bulk' && (
              <div className="flex items-center justify-center px-8 py-10">
                <p className="text-stone-500 text-sm text-center">
                  {selectedPrize
                    ? `Tekan tombol di bawah untuk mengundi ${selectedPrize.stock} pemenang sekaligus`
                    : 'Pilih hadiah terlebih dahulu'}
                </p>
              </div>
            )}

            {/* Tombol aksi */}
            <div className="px-8 pb-8">
              {mode === 'single' ? (
                !spinning ? (
                  <button
                    onClick={handleStart}
                    disabled={!selectedPrize || eligibleGuests.length === 0}
                    className="w-full py-4 bg-amber-400 text-stone-900 text-base font-bold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                  >
                    ▶ Mulai Undian
                  </button>
                ) : (
                  <button
                    onClick={handleManualStop}
                    className="w-full py-4 bg-red-500 text-white text-base font-bold rounded-xl hover:bg-red-400 transition-colors shadow-lg shadow-red-900/40 animate-pulse"
                  >
                    ■ Stop Manual
                  </button>
                )
              ) : (
                <button
                  onClick={handleBulkSpin}
                  disabled={!selectedPrize || bulkSpinning}
                  className="w-full py-4 bg-amber-400 text-stone-900 text-base font-bold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                >
                  {bulkSpinning ? '⏳ Sedang Mengundi...' : '⚡ Undi Semua Sekaligus'}
                </button>
              )}
            </div>
          </div>

          {/* ── Tabel Pemenang ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            {/* Posisi: header tabel Daftar Pemenang, ganti bagian ini */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Daftar Pemenang</h3>
                <p className="text-xs text-stone-400 mt-0.5">{history.length} pemenang tercatat</p>
              </div>
              <button
                onClick={() => {
                  if (!confirm('Reset semua data undian? Stok hadiah perlu diatur ulang secara manual.')) return
                  fetch('/lottery/reset', {
                    method: 'DELETE',
                    headers: {
                      'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                      ),
                    },
                  })
                    .then(r => r.json())
                    .then(data => {
                      if (data.success) {
                        setHistory([])
                        setSelectedPrize(null)
                        setReelValue('-------')
                        setLocalPrizes(prizes.map(p => ({ ...p, stock: p.initial_stock, is_claimed: false }))) // ini
                      }
                    })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Undian
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-sm">
                Belum ada pemenang undian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-10">#</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Nama Tamu</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Kode</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Hadiah</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {history.map((item, i) => (
                      <tr key={i} className="hover:bg-stone-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-stone-800">{item.guest?.name ?? '-'}</p>
                          {item.guest?.office && (
                            <p className="text-xs text-stone-400">{item.guest.office}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1 rounded-lg">
                            {item.guest?.code ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            {item.prize?.name ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-stone-400">
                          {item.won_at
                            ? new Date(item.won_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single Winner Modal */}
      {winner && (
        <WinnerCard
          winner={winner}
          prize={selectedPrize}
          onNext={handleReset}
        />
      )}

      {/* Bulk Winner Modal */}
      {showBulkModal && bulkWinners.length > 0 && (
        <WinnerCard
          winner={bulkWinners[bulkIndex].guest}
          prize={selectedPrize}
          onNext={handleBulkNext}
          isBulk={true}
          bulkWinners={bulkWinners}
          bulkIndex={bulkIndex}
        />
      )}

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AdminLayout>
  )
}