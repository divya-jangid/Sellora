import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import ProductContent from '../components/ProductContent'

const Products = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Fixed Header */}
      <div className="shrink-0">
        <Header />
      </div>

      {/* Middle Section */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar Scroll */}
        <aside className="w-64 shrink-0 h-full overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content Scroll */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-slate-50">
          <ProductContent />
        </main>

      </div>

      {/* Fixed Footer */}
      <div className="shrink-0">
        <Footer />
      </div>

    </div>
  )
}

export default Products