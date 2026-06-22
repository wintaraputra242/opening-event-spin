import { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'

export default function AdminLayout({ children, title = '', defaultSidebarOpen = true }) {
  const { url } = usePage()
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)

  const navItems = [
    { label: 'Data Tamu', href: '/guests', icon: '👥', match: '/guests' },
    { label: 'Data Hadiah', href: '/prizes', icon: '🎁', match: '/prizes' },
    { label: 'Spin Undian', href: '/lottery', icon: '🎰', match: '/lottery' },
  ]

  const handleLogout = () => {
    router.post('/logout')
  }

  return (
    <div className="flex min-h-screen font-sans bg-[#F8F7F4]">

      {/* Sidebar */}
      <aside className={[
        'min-h-screen bg-[#0F1B2D] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden',
        sidebarOpen ? 'w-60' : 'w-0',
      ].join(' ')}>
        <div className="w-60">
          {/* Brand */}
          <div className="px-6 pt-7 pb-6 border-b border-white/[0.08]">
            <div className="text-[11px] font-semibold tracking-widest text-[#A8A29E] uppercase mb-1">
              Event Opening
            </div>
            <div className="text-lg font-bold text-[#FAFAF9] tracking-tight">
              Admin Panel
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 flex-1">
            {navItems.map((item) => {
              const isActive = url.startsWith(item.match)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1 text-sm no-underline transition-all duration-150',
                    isActive
                      ? 'font-semibold text-[#FAFAF9] bg-white/10'
                      : 'font-normal text-[#A8A29E] hover:bg-white/5 hover:text-[#D6D3D1]',
                  ].join(' ')}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4A9FFF]" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/[0.08]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border-none cursor-pointer text-sm font-normal text-[#A8A29E] bg-transparent text-left transition-all duration-150 hover:bg-white/5 hover:text-red-300"
            >
              <span className="text-base">🚪</span>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="h-[60px] bg-white border-b border-[#E7E5E4] flex items-center px-6 flex-shrink-0 gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors flex-shrink-0"
            title={sidebarOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <h1 className="text-base font-semibold text-[#1C1917] m-0 tracking-tight">
            {title}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}