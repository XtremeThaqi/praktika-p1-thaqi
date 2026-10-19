import React from 'react'
import { createRoot } from 'react-dom/client'
import ConnectionStatus from './ConnectionStatus'
import './styles.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 font-semibold tracking-tight">
          Bizneset e Lipjanit
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Projekt në zhvillim</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Katalogu i bizneseve të komunës së Lipjanit
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          Po përgatisim platformën për gjetjen e bizneseve, shërbimeve dhe kontakteve lokale.
          Katalogu do të publikohet pasi të përfundojë zhvillimi dhe testimi.
        </p>
        {import.meta.env.DEV && <ConnectionStatus />}
      </main>
      <footer className="mx-auto max-w-6xl border-t border-slate-200 px-6 py-6 text-sm text-slate-600">
        Projekt studentor i praktikës profesionale. Nuk është regjistër zyrtar i komunës.
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>,
)
