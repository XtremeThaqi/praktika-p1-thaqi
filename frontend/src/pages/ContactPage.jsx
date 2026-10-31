import Link from '../components/Link'
export default function ContactPage({ navigate }) {
  return (
    <section className="container py-10 sm:py-14">
      <p className="eyebrow">Kontakt</p>
      <h1 className="page-title mt-4 max-w-3xl">
        Një katalog më i dobishëm, së bashku.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
        Për regjistrimin e bizneseve, korrigjime ose përditësime të të dhënave
        dhe kërkesa për reklamim, na shkruani në adresën më poshtë.
      </p>
      <div className="mt-9 grid max-w-5xl gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="eyebrow">Kanali i kontaktit</p>
          <h2 className="mt-3 font-display text-2xl leading-tight text-forest">
            Na kontaktoni me email
          </h2>
          <p className="mt-4 leading-7 text-muted">
            Dërgoni kërkesën tuaj në{' '}
            <a
              className="font-semibold text-forest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              href="mailto:anejiakneji55@outlook.com"
            >
              anejiakneji55@outlook.com
            </a>.
          </p>
        </section>
        <section className="rounded-2xl border border-line bg-[#eaf0e6] p-6 sm:p-8">
          <p className="eyebrow">Rreth katalogut</p>
          <h2 className="mt-3 font-display text-2xl leading-tight text-forest">
            Një projekt për të zbuluar afër.
          </h2>
          <p className="mt-4 leading-7 text-muted">
            Kjo platformë është projekt studentor për të eksploruar kategori,
            vendbanime dhe shërbime në një katalog të thjeshtë.
          </p>
        </section>
      </div>
      <Link
        href="/bizneset"
        navigate={navigate}
        className="button-primary mt-8"
      >
        Eksploro katalogun
      </Link>
    </section>
  )
}
