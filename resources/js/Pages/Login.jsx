import { useForm, Head } from '@inertiajs/react'

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    token: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/login')
  }

  return (
    <>
      <Head title="Login" />

      <div className="flex min-h-screen bg-stone-100 font-sans">

        {/* Left Panel */}
        <div className="hidden md:flex w-72 flex-shrink-0 bg-[#0F1B2D] flex-col justify-center px-9 py-12">
          <p className="text-xs font-semibold tracking-widest text-white uppercase mb-1">
            Event Opening
          </p>
          <h1 className="text-2xl font-bold text-stone-50 tracking-tight mb-4">
            Admin Panel
          </h1>
          <p className="text-sm text-white leading-relaxed mb-9">
            Kelola tamu undangan, hadiah, dan undian dalam satu tempat.
          </p>

          <div className="flex flex-col gap-3">
            {['Data Tamu', 'Data Hadiah', 'Spin Undian'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A9FFF] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 p-10">

            {/* Accent bar */}
            <div className="w-8 h-0.5 bg-[#4A9FFF] rounded mb-6" />

            <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-1">
              Masuk ke sistem
            </h2>
            <p className="text-sm text-white mb-8">
              Masukkan token akses untuk melanjutkan.
            </p>

            <form onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">
                  Token Akses
                </label>
                <input
                  type="password"
                  value={data.token}
                  onChange={(e) => setData('token', e.target.value)}
                  placeholder="Masukkan token..."
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-lg text-sm text-stone-900 bg-stone-50 font-mono tracking-widest outline-none transition
                                        border focus:border-stone-400 focus:bg-white
                                        ${errors.token ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
                />

                {errors.token && (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    {errors.token}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-6 py-2.5 bg-blue-500 hover:bg-blue-700 disabled:bg-stone-400 text-stone-50 text-sm font-semibold rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
              >
                {processing ? 'Memproses...' : 'Masuk →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}