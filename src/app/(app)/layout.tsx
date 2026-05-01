import BottomNav from '@/components/nav/BottomNav'
import Sidebar from '@/components/nav/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
