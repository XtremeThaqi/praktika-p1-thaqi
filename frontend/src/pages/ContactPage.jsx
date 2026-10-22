import Link from '../components/Link'

export default function ContactPage({ navigate }) {
  return (
    <section className="container py-16 sm:py-24">
      <p className="eyebrow">Biseda fillon këtu</p>
      <h1 className="page-title mt-5 max-w-3xl">Një katalog më i dobishëm, së bashku.</h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">Për shtimin e një biznesi, korrigjimin e të dhënave ose reklamimin, kontakti i administratorit do të publikohet këtu pasi të konfirmohet.</p>
      <div className="mt-10 max-w-2xl rounded-2xl border border-line bg-white p-7">
        <h2 className="text-xl font-semibold">Një projekt për të zbuluar afër</h2>
        <p className="mt-4 leading-7 text-muted">Kjo platformë është projekt studentor. Bizneset dhe reklamat me shenjën “Demo” përmbajnë të dhëna demonstrimi. Ato nuk duhen përdorur si informacion real kontakti ose si rekomandim.</p>
      </div>
      <Link href="/bizneset" navigate={navigate} className="button-primary mt-8">Eksploro katalogun</Link>
    </section>
  )
}
