import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/Layouts/AdminLayout'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCsrf() {
  return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '')
}

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
        ? 'bg-[#4A9FFF] text-white shadow-lg shadow-[#4A9FFF]/40 scale-105'
        : 'bg-stone-800 text-[#4A9FFF]',
    ].join(' ')}>
      {display}
    </div>
  )
}

// ─── Spin Wheel Canvas ────────────────────────────────────────────────────────

const WHEEL_COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3',
  '#1DD1A1', '#C8D6E5', '#EE5A24', '#009432',
  '#0652DD', '#9980FA', '#ED4C67', '#F79F1F',
]

function SpinWheel({ guests, spinning, targetCode, onSpinEnd }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const velocityRef = useRef(0)
  const rafRef = useRef(null)
  const spinningRef = useRef(false)
  const onSpinEndRef = useRef(onSpinEnd)

  useEffect(() => { onSpinEndRef.current = onSpinEnd }, [onSpinEnd])

  const segments = guests.slice(0, 60)
  const segCount = segments.length
  const arc = segCount > 0 ? (2 * Math.PI) / segCount : 0

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || segCount === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const R = W / 2 - 8
    const cx = W / 2
    const cy = H / 2

    ctx.clearRect(0, 0, W, H)

    // Shadow base
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 28
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.fillStyle = '#1C1917'
    ctx.fill()
    ctx.restore()

    // Segments
    segments.forEach((g, i) => {
      const startAngle = angleRef.current + i * arc
      const endAngle = startAngle + arc

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Code text
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(0,0,0,0.72)'
      ctx.font = `bold ${Math.max(9, Math.min(13, 340 / segCount))}px monospace`
      ctx.fillText(g.code, R - 14, 4)
      ctx.restore()
    })

    // Outer border ring
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.strokeStyle = '#0F1B2D'
    ctx.lineWidth = 12
    ctx.stroke()

    // Center hub gradient
    const hubR = 30
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, hubR)
    grad.addColorStop(0, '#60AEFF')
    grad.addColorStop(1, '#0F4C8A')
    ctx.beginPath()
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#FFD700'
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏆', cx, cy)
  }, [segments, arc, segCount])

  const animate = useCallback(() => {
    if (!spinningRef.current) return
    angleRef.current += velocityRef.current
    velocityRef.current *= 0.992
    draw()
    if (velocityRef.current > 0.002) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      spinningRef.current = false
      cancelAnimationFrame(rafRef.current)
      onSpinEndRef.current?.()
    }
  }, [draw])

  // Trigger ketika prop spinning berubah jadi true
  useEffect(() => {
    if (spinning && !spinningRef.current && segCount > 0) {
      const targetIdx = segments.findIndex(g => g.code === targetCode)
      const finalIdx = targetIdx >= 0 ? targetIdx : Math.floor(Math.random() * segCount)

      // Hitung angle agar pointer (atas = -PI/2) tepat di tengah segmen finalIdx
      const desiredAngle = -Math.PI / 2 - (finalIdx * arc + arc / 2)
      const currentNorm = angleRef.current % (2 * Math.PI)
      const diff = ((desiredAngle - currentNorm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      const spins = 6 + Math.floor(Math.random() * 4)
      const totalRotation = spins * 2 * Math.PI + diff

      // sum geometric: v0 / (1 - 0.992) ≈ v0 * 125
      velocityRef.current = totalRotation / 125

      spinningRef.current = true
      rafRef.current = requestAnimationFrame(animate)
    }
    if (!spinning && !spinningRef.current) draw()
  }, [spinning, targetCode, segments, arc, segCount, animate, draw])

  useEffect(() => { draw() }, [draw])
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer segitiga */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10 drop-shadow-md">
        <div style={{
          width: 0, height: 0,
          borderLeft: '13px solid transparent',
          borderRight: '13px solid transparent',
          borderTop: '30px solid #4A9FFF',
          filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))',
        }} />
      </div>
      <canvas ref={canvasRef} width={380} height={380} className="rounded-full" />
    </div>
  )
}

// ─── Winner Card Modal ─────────────────────────────────────────────────────────

function WinnerCard({ winner, prize, onNext, bulkTotal = 0, bulkIndex = 0 }) {
  const isBulk = bulkTotal > 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 text-center"
        style={{ animation: 'fadeInScale 0.35s ease' }}>

        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏆</span>
        </div>

        {isBulk && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full text-xs font-semibold text-stone-500">
              Pemenang {bulkIndex + 1}
              <span className="text-stone-300">/</span>
              {bulkTotal}
            </span>
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-2">
          Selamat! Pemenang Undian
        </p>
        <h2 className="text-2xl font-bold text-stone-800 mb-1">{winner.name}</h2>
        {winner.office && <p className="text-sm text-stone-400 mb-1">{winner.office}</p>}

        <div className="inline-block mt-3 mb-5 px-5 py-2.5 bg-stone-100 rounded-xl">
          <span className="text-xs text-stone-400 block mb-0.5">Kode Undian</span>
          <span className="font-mono text-xl font-bold text-stone-700 tracking-widest">{winner.code}</span>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6">
          <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Hadiah</p>
          <p className="text-lg font-bold text-stone-800">{prize.name}</p>
          {prize.description && <p className="text-sm text-stone-400 mt-0.5">{prize.description}</p>}
        </div>

        <button
          onClick={onNext}
          className="w-full px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
        >
          {isBulk && bulkIndex < bulkTotal - 1 ? `Pemenang Berikutnya →` : 'Selesai'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LotteryIndex({ guests, prizes, results: initialResults }) {
  const eligibleGuests = guests.filter(g => g.is_present && g.code)

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedPrize, setSelectedPrize] = useState(null)
  const [localPrizes, setLocalPrizes] = useState(prizes)
  const [history, setHistory] = useState(initialResults || [])
  const [error, setError] = useState(null)

  // Mode toggles
  const [spinMode, setSpinMode] = useState('single')  // 'single' | 'bulk'
  const [visualMode, setVisualMode] = useState('slot')    // 'slot'   | 'wheel'

  // Slot state
  const [slotSpinning, setSlotSpinning] = useState(false)
  const [reelValue, setReelValue] = useState('-------')

  // Wheel state — satu slot roda, di-drive oleh queue
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelTargetCode, setWheelTargetCode] = useState(null)

  // Bulk wheel queue: array of winner objects dari backend
  const wheelQueueRef = useRef([])  // sisa pemenang yang belum diputar
  const [wheelProgress, setWheelProgress] = useState({ current: 0, total: 0 })

  // Winner modal
  const [shownWinners, setShownWinners] = useState([]) // antrian modal setelah semua wheel selesai
  const [modalIndex, setModalIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)

  // Refs for slot
  const reelIntervalRef = useRef(null)
  const autoStopRef = useRef(null)
  const spinPoolRef = useRef([])
  const currentIdxRef = useRef(0)

  const availablePrizes = localPrizes.filter(p => !p.is_claimed && p.stock > 0)

  const decrementStock = (prizeId, count = 1) => {
    setLocalPrizes(prev => prev.map(p => {
      if (p.id !== prizeId) return p
      const newStock = Math.max(0, p.stock - count)
      return { ...p, stock: newStock, is_claimed: newStock <= 0 }
    }))
  }

  const isAnySpin = slotSpinning || wheelSpinning

  // ── SLOT: single ──────────────────────────────────────────────────────────

  const handleSlotStart = () => {
    if (!selectedPrize || slotSpinning || eligibleGuests.length === 0) return
    setError(null)

    const wonIds = history.map(r => r.guest_id ?? r.guest?.id)
    const pool = shuffle(eligibleGuests.filter(g => !wonIds.includes(g.id)))
    if (pool.length === 0) { setError('Tidak ada tamu eligible tersisa.'); return }

    spinPoolRef.current = pool
    currentIdxRef.current = 0
    setSlotSpinning(true)

    reelIntervalRef.current = setInterval(() => {
      const g = spinPoolRef.current[currentIdxRef.current % spinPoolRef.current.length]
      setReelValue(g.code)
      currentIdxRef.current++
    }, 80)

    const dur = 4000 + Math.random() * 1000
    autoStopRef.current = setTimeout(() => doSlotStop(), dur)
  }

  const doSlotStop = () => {
    clearInterval(reelIntervalRef.current)
    clearTimeout(autoStopRef.current)
    setSlotSpinning(false)

    fetch('/lottery/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
      body: JSON.stringify({ prize_id: selectedPrize.id }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setError(data.message); setReelValue('-------'); return }
        const w = data.guest
        setReelValue(w.code)
        decrementStock(selectedPrize.id)
        addToHistory(w, selectedPrize, data.result_id) // tambah result_id
        openModal([{ guest: w, prize: selectedPrize }])
      })
      .catch(() => setError('Terjadi kesalahan saat menyimpan hasil undian.'))
  }

  const handleSlotManualStop = () => {
    if (!slotSpinning) return
    clearTimeout(autoStopRef.current)
    doSlotStop()
  }

  // ── SLOT: bulk ────────────────────────────────────────────────────────────

  const handleSlotBulk = () => {
    if (!selectedPrize || isAnySpin) return
    setError(null)

    spinPoolRef.current = shuffle(eligibleGuests)
    currentIdxRef.current = 0
    setSlotSpinning(true)

    reelIntervalRef.current = setInterval(() => {
      const g = spinPoolRef.current[currentIdxRef.current % spinPoolRef.current.length]
      setReelValue(g.code)
      currentIdxRef.current++
    }, 80)

    const dur = 4000 + Math.random() * 1000
    setTimeout(() => {
      clearInterval(reelIntervalRef.current)
      setSlotSpinning(false)
      setReelValue('-------')

      fetch('/lottery/bulk-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ prize_id: selectedPrize.id }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) { setError(data.message); return }
          decrementStock(selectedPrize.id, data.winners.length)
          const entries = data.winners.map(w => ({ guest: w.guest, prize: selectedPrize, result_id: w.result_id }))
          entries.forEach(e => addToHistory(e.guest, e.prize, e.result_id)) // tambah result_id
          openModal(entries)
        })
        .catch(() => setError('Terjadi kesalahan saat bulk spin.'))
    }, dur)
  }

  // ── WHEEL: single ─────────────────────────────────────────────────────────

  const handleWheelSingle = () => {
    if (!selectedPrize || wheelSpinning || eligibleGuests.length === 0) return
    setError(null)

    fetch('/lottery/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
      body: JSON.stringify({ prize_id: selectedPrize.id }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setError(data.message); return }
        const w = data.guest
        decrementStock(selectedPrize.id)
        addToHistory(w, selectedPrize, data.result_id) // tambah result_id

        wheelQueueRef.current = [{ guest: w, prize: selectedPrize }]
        setWheelProgress({ current: 1, total: 1 })
        setWheelTargetCode(w.code)
        setWheelSpinning(true)
      })
      .catch(() => setError('Terjadi kesalahan saat mengundi.'))
  }

  // ── WHEEL: bulk ───────────────────────────────────────────────────────────

  const handleWheelBulk = () => {
    if (!selectedPrize || isAnySpin || eligibleGuests.length === 0) return
    setError(null)

    fetch('/lottery/bulk-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
      body: JSON.stringify({ prize_id: selectedPrize.id }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setError(data.message); return }
        const entries = data.winners.map(w => ({ guest: w.guest, prize: selectedPrize, result_id: w.result_id }))
        decrementStock(selectedPrize.id, entries.length)
        entries.forEach(e => addToHistory(e.guest, e.prize, e.result_id)) // tambah result_id

        wheelQueueRef.current = entries
        setWheelProgress({ current: 1, total: entries.length })
        setWheelTargetCode(entries[0].guest.code)
        setWheelSpinning(true)
      })
      .catch(() => setError('Terjadi kesalahan saat bulk spin.'))
  }

  // Dipanggil SpinWheel setelah satu putaran selesai
  const handleWheelSpinEnd = useCallback(() => {
    const queue = wheelQueueRef.current
    const done = wheelQueueRef.current.shift() // ambil yang baru selesai, mutasi ref

    // Tampilkan modal pemenang baru selesai
    setShownWinners(prev => [...prev, done])
    setShowModal(true)
    setModalIndex(prev => prev) // trigger re-render modal dengan index terakhir

    setWheelSpinning(false)
    setWheelTargetCode(null)
    // Putaran berikutnya dilanjutkan setelah user klik "Next" di modal
  }, [])

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openModal = (entries) => {
    setShownWinners(entries)
    setModalIndex(0)
    setShowModal(true)
  }

  const handleModalNext = () => {
    const nextIdx = modalIndex + 1
    if (nextIdx < shownWinners.length) {
      setModalIndex(nextIdx)
    } else {
      // Modal habis
      setShowModal(false)
      setShownWinners([])
      setModalIndex(0)
      setSelectedPrize(null)
      setReelValue('-------')

      // Kalau masih ada wheel queue (bulk wheel), lanjutkan putaran berikutnya
      if (wheelQueueRef.current.length > 0) {
        const next = wheelQueueRef.current[0]
        const total = wheelProgress.total
        setWheelProgress(p => ({ ...p, current: total - wheelQueueRef.current.length + 1 }))
        setWheelTargetCode(next.guest.code)
        setWheelSpinning(true)
      } else {
        localStorage.removeItem('select-prize')
        setWheelProgress({ current: 0, total: 0 })
      }
    }
  }

  const addToHistory = (guest, prize, resultId = null) => {
    setHistory(prev => [{
      id: resultId,
      guest,
      prize,
      guest_id: guest.id,
      won_at: new Date().toISOString(),
    }, ...prev])
  }

  const handleReset = () => {
    if (!confirm('Reset semua data undian? Stok hadiah perlu diatur ulang secara manual.')) return
    fetch('/lottery/reset', {
      method: 'DELETE',
      headers: { 'X-XSRF-TOKEN': getCsrf() },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setHistory([])
          setSelectedPrize(null)
          setReelValue('-------')
          setWheelTargetCode(null)
          setWheelProgress({ current: 0, total: 0 })
          wheelQueueRef.current = []
          setLocalPrizes(prizes.map(p => ({ ...p, stock: p.initial_stock ?? p.stock, is_claimed: false })))
        }
      })
  }

  const reelChars = reelValue.padEnd(7, ' ').split('').slice(0, 7)

  const isBulkMode = spinMode === 'bulk'

  const handleSpinAction = () => {
    if (visualMode === 'slot') {
      isBulkMode ? handleSlotBulk() : handleSlotStart()
    } else {
      isBulkMode ? handleWheelBulk() : handleWheelSingle()
    }
  }

  const [respinning, setRespinning] = useState(false)
  const [respinItem, setRespinItem] = useState(null) // item row yang sedang direspin

  const handleRespin = (item) => {
    if (!confirm(`Respin dan ganti pemenang "${item.guest?.name}"?`)) return
    setError(null)
    setRespinItem(item)
    setRespinning(true)

    if (visualMode === 'slot') {
      // Jalankan animasi slot dulu, fetch ke backend setelah animasi selesai
      spinPoolRef.current = shuffle(eligibleGuests)
      currentIdxRef.current = 0
      setSlotSpinning(true)

      reelIntervalRef.current = setInterval(() => {
        const g = spinPoolRef.current[currentIdxRef.current % spinPoolRef.current.length]
        setReelValue(g.code)
        currentIdxRef.current++
      }, 80)

      const dur = 4000 + Math.random() * 1000
      autoStopRef.current = setTimeout(() => {
        clearInterval(reelIntervalRef.current)
        setSlotSpinning(false)
        doRespin(item)
      }, dur)
    } else {
      // Wheel: fetch dulu, baru animasi setelah dapat pemenang
      doRespin(item)
    }
  }

  const doRespin = (item) => {
    fetch('/lottery/respin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
      body: JSON.stringify({ lottery_result_id: item.id }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          setError(data.message)
          setRespinning(false)
          setRespinItem(null)
          setReelValue('-------')
          return
        }

        const newGuest = data.guest
        const prize = data.prize

        // Update row di history
        setHistory(prev => prev.map(h =>
          (h.id === item.id)
            ? { ...h, id: data.result_id, guest: newGuest, prize, won_at: new Date().toISOString() }
            : h
        ))

        setReelValue(newGuest.code)

        if (visualMode === 'wheel') {
          // Trigger animasi wheel dengan pemenang baru
          wheelQueueRef.current = [{ guest: newGuest, prize }]
          setWheelProgress({ current: 1, total: 1 })
          setWheelTargetCode(newGuest.code)
          setWheelSpinning(true)
        } else {
          // Slot: langsung tampil modal
          openModal([{ guest: newGuest, prize }])
        }

        setRespinning(false)
        setRespinItem(null)
      })
      .catch((e) => {
        console.log(e);

        setError('Terjadi kesalahan saat respin.')
        setRespinning(false)
        setRespinItem(null)
        setReelValue('-------')
      })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Spin Undian" defaultSidebarOpen={false}>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: Control Panel ──────────────────────────────────── */}
        <div className={`${!wheelSpinning && !slotSpinning ? 'xl:col-span-1' : 'xl:col-span-0'} space-y-4`}>

          {/* Visual Mode */}
          {!wheelSpinning && !slotSpinning && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Tampilan Spin</p>
              <div className="grid grid-cols-2 gap-2">
                {[['slot', '🎰 Slot'], ['wheel', '🎡 Wheel']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => !isAnySpin && setVisualMode(val)}
                    disabled={isAnySpin}
                    className={[
                      'px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                      visualMode === val
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300',
                    ].join(' ')}
                  >{label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Spin Mode */}
          {!wheelSpinning && !slotSpinning && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Mode Undian</p>
              <div className="grid grid-cols-2 gap-2">
                {[['single', '🎯 Sekali'], ['bulk', '⚡ Sekaligus']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => !isAnySpin && setSpinMode(val)}
                    disabled={isAnySpin}
                    className={[
                      'px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                      spinMode === val
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300',
                    ].join(' ')}
                  >{label}</button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {spinMode === 'single'
                  ? visualMode === 'wheel'
                    ? 'Putar roda sekali untuk satu pemenang.'
                    : 'Spin slot untuk satu pemenang per klik.'
                  : visualMode === 'wheel'
                    ? 'Roda berputar satu per satu untuk setiap pemenang.'
                    : 'Semua stok hadiah diundi sekaligus.'}
              </p>
            </div>
          )}

          {/* Pilih Hadiah */}
          {!wheelSpinning && !slotSpinning && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-800">Pilih Hadiah</h3>
                <p className="text-xs text-stone-400 mt-0.5">Tentukan hadiah sebelum spin dimulai</p>
              </div>
              <div className="p-4 space-y-2 max-h-56 overflow-y-auto">
                {availablePrizes.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-6">Semua hadiah sudah habis.</p>
                ) : availablePrizes.map(prize => (
                  <button
                    key={prize.id}
                    onClick={() => {
                      localStorage.setItem('select-prize', JSON.stringify(prize))
                      return !isAnySpin && setSelectedPrize(prize)
                    }}
                    disabled={isAnySpin}
                    className={[
                      'w-full text-left px-4 py-3 rounded-xl border transition-all',
                      selectedPrize?.id === prize.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50',
                      isAnySpin ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-800">{prize.name}</span>
                      <span className={[
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        prize.stock <= 3 ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600',
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
          )}

          {/* Info eligible */}
          {!wheelSpinning && !slotSpinning && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400">Tamu Peserta Undian</p>
                  <p className="text-2xl font-bold text-stone-800 mt-0.5">{eligibleGuests.length} Orang</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">👥</div>
              </div>
              <p className="text-xs text-stone-400 mt-2">Tamu hadir &amp; memiliki kode undian</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Spin Area + Table ──────────────────────────────── */}
        <div className={`${!wheelSpinning && !slotSpinning ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-5`}>

          {/* ─── SLOT VIEW ─── */}
          {visualMode === 'slot' && (
            <div className="bg-[#0F1B2D] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-8 pt-8 pb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Event Opening</p>
                <h1 className="text-2xl font-bold text-white">Spin Undian Berhadiah</h1>
              </div>

              <div className="mx-8 mb-4 px-5 py-3 bg-stone-800 rounded-xl text-center">
                {selectedPrize ? (
                  <>
                    <p className="text-xs text-stone-400 mb-0.5">Hadiah yang Diundi</p>
                    <p className="text-lg font-bold text-blue-400">{selectedPrize.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-stone-500">— Pilih hadiah terlebih dahulu —</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 px-8 py-6">
                {reelChars.map((char, i) => (
                  char.trim() === ''
                    ? <div key={i} className="w-3" />
                    : <SlotReel key={i} value={char} spinning={slotSpinning} />
                ))}
              </div>

              <div className="text-center pb-4">
                <p className={['text-sm font-medium', slotSpinning ? 'text-blue-400' : 'text-stone-500'].join(' ')}>
                  {slotSpinning
                    ? (isBulkMode ? 'Mengundi semua pemenang...' : 'Mengundi...')
                    : (selectedPrize
                      ? (isBulkMode ? `Siap mengundi ${selectedPrize.stock} pemenang sekaligus` : 'Siap untuk diundi')
                      : 'Pilih hadiah untuk memulai')}
                </p>
              </div>

              <div className="px-8 pb-8 flex gap-3">
                {!slotSpinning ? (
                  <button
                    onClick={handleSpinAction}
                    disabled={!selectedPrize || eligibleGuests.length === 0}
                    className="flex-1 py-4 bg-blue-400 text-stone-900 text-base font-bold rounded-xl hover:bg-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                  >
                    {isBulkMode ? '⚡ Undi Semua Sekaligus' : '▶ Mulai Undian'}
                  </button>
                ) : (
                  !isBulkMode && (
                    <button
                      onClick={handleSlotManualStop}
                      className="flex-1 py-4 bg-red-500 text-white text-base font-bold rounded-xl hover:bg-red-400 transition-colors shadow-lg animate-pulse"
                    >
                      ■ Stop Manual
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* ─── WHEEL VIEW ─── */}
          {visualMode === 'wheel' && (
            <div className="bg-[#0F1B2D] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-8 pt-8 pb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Event Opening</p>
                <h1 className="text-2xl font-bold text-white">Spin Wheel Undian</h1>
              </div>

              <div className="mx-8 mb-4 px-5 py-3 bg-stone-800 rounded-xl text-center">
                {(selectedPrize || localStorage.getItem('select-prize')) ? (
                  <div className={`flex items-center ${spinMode !== 'bulk' ? 'justify-center m-auto' : 'justify-between'}`}>
                    <div>
                      <p className="text-xs text-stone-400 mb-0.5">Hadiah yang Diundi</p>
                      <p className="text-lg font-bold text-blue-400">{selectedPrize?.name || (JSON.parse(localStorage.getItem('select-prize'))?.name)}</p>
                    </div>
                    {/* Progress bulk wheel */}
                    {(wheelProgress.total > 1) && (
                      <div className="text-right">
                        <p className="text-xs text-stone-400 mb-0.5">Progress</p>
                        <p className="text-lg font-bold text-blue-400">
                          {wheelProgress.current} <span className="text-stone-500 text-sm font-normal">/ {wheelProgress.total}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">— Pilih hadiah terlebih dahulu —</p>
                )}
              </div>

              {/* Wheel canvas */}
              <div className="flex justify-center px-8 pb-6">
                {eligibleGuests.length > 0 ? (
                  <SpinWheel
                    guests={eligibleGuests}
                    spinning={wheelSpinning}
                    targetCode={wheelTargetCode}
                    onSpinEnd={handleWheelSpinEnd}
                  />
                ) : (
                  <div className="w-[380px] h-[380px] rounded-full bg-stone-800 flex items-center justify-center">
                    <p className="text-stone-500 text-sm text-center px-8">Belum ada tamu eligible untuk diundi.</p>
                  </div>
                )}
              </div>

              <div className="text-center pb-4">
                <p className={['text-sm font-medium transition-colors', wheelSpinning ? 'text-blue-400 animate-pulse' : 'text-stone-500'].join(' ')}>
                  {wheelSpinning
                    ? (wheelProgress.total > 1
                      ? `Memutar roda pemenang ke-${wheelProgress.current} dari ${wheelProgress.total}...`
                      : 'Roda sedang berputar...')
                    : (selectedPrize
                      ? (isBulkMode ? `Siap mengundi ${selectedPrize.stock} pemenang satu per satu` : 'Siap untuk diundi')
                      : 'Pilih hadiah untuk memulai')}
                </p>
              </div>

              <div className="px-8 pb-8">
                <button
                  onClick={handleSpinAction}
                  disabled={!selectedPrize || wheelSpinning || eligibleGuests.length === 0}
                  className="w-full py-4 bg-blue-400 text-stone-900 text-base font-bold rounded-xl hover:bg-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                >
                  {wheelSpinning
                    ? '🌀 Roda Berputar...'
                    : isBulkMode ? '⚡ Undi Semua (Satu per Satu)' : '🎡 Putar Roda'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Winners Table ─── */}
          {!wheelSpinning && !slotSpinning && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Daftar Pemenang</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{history.length} pemenang tercatat</p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Undian
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-sm">Belum ada pemenang undian.</div>
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
                        <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {history.map((item, i) => (
                        <tr key={i} className="hover:bg-stone-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-stone-800">{item.guest?.name ?? '-'}</p>
                            {item.guest?.office && <p className="text-xs text-stone-400">{item.guest.office}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1 rounded-lg">
                              {item.guest?.code ?? '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                              {item.prize?.name ?? '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-stone-400">
                            {item.won_at
                              ? new Date(item.won_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleRespin(item)}
                              disabled={isAnySpin || respinning}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Respin — ganti pemenang ini"
                            >
                              <svg className={`w-3.5 h-3.5 ${respinning && respinItem?.id === item.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {respinning && respinItem?.id === item.id ? 'Respin...' : 'Respin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Winner Modal ── */}
      {showModal && shownWinners.length > 0 && (
        <WinnerCard
          winner={shownWinners[modalIndex].guest}
          prize={shownWinners[modalIndex].prize}
          onNext={handleModalNext}
          bulkTotal={shownWinners.length + wheelQueueRef.current.length}
          bulkIndex={modalIndex}
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