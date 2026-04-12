import { useState } from 'react'
import './App.css'

const NAMES = [
  'Kalle', 'Jussu', 'Pekka', 'Jorma', 'Seppo', 'Miika', 'Ismo', 'Heikki',
  'Juhani', 'Matti', 'Keijo', 'Risto', 'Jani', 'Antti', 'Timo', 'Vesa',
  'Tuomas', 'Lauri', 'Sami', 'Petri', 'Jukka', 'Hannu', 'Otto', 'Ville',
  'Aleksi', 'Mikko', 'Veikko', 'Paavo', 'Tapio', 'Leevi', 'Sakari', 'Olavi',
  'Onni', 'Ilkka', 'Erkki', 'Raimo', 'Pentti', 'Urho', 'Arvo', 'Väinö',
  'Eino', 'Toivo', 'Osmo', 'Reino', 'Aarne', 'Kalevi', 'Aimo', 'Taisto',
  'Veijo', 'Unto',
]

const ADJECTIVES = [
  'Hytkyvä', 'Paleleva', 'Kiittävä', 'Nopea', 'Riittoisa', 'Ahkera',
  'Utelias', 'Rohkea', 'Hiljainen', 'Riemukas', 'Väsymätön', 'Juureva',
  'Kuulas', 'Kepeä', 'Salaperäinen', 'Hurja', 'Vimmattu', 'Nokela',
  'Hiipivä', 'Hehkuva', 'Jäätävä', 'Tulinen', 'Tuulinen', 'Mahtaileva',
  'Viiltävä', 'Koominen', 'Kiukkuinen', 'Vauhdikas', 'Harkitseva', 'Häijy',
  'Suloinen', 'Rämäpäinen', 'Hämmästynyt', 'Turhamainen', 'Tarkkaavainen',
  'Loistava', 'Häilyvä', 'Omituinen', 'Tahmea', 'Kalpea', 'Hempeä',
  'Huimaava', 'Liukas', 'Rempseä', 'Kitsas', 'Värikäs', 'Uljas',
  'Sisukas', 'Tyyni', 'Pöyhistynyt',
]

const SUFFIXES = [
  '42', '99', '007', 'X7', 'Z3', '#1', '!!', 'X9', '#0', '77',
  '13', '88', '55', '66', '44', 'Z9', 'X1', '#7', '69', '21',
  'ZZ', 'XX', '##', '4X', '0Z', '!9', '#4', 'A1', 'B2', 'C3',
]

function generateCodename() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)]
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  return `${adjective}${name}${suffix}`
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [codename, setCodename] = useState('')

  const handleLogin = () => {
    const cachedName = localStorage.getItem('codename')
    if (cachedName) {
      setCodename(cachedName)
    } else {
      const newName = generateCodename()
      localStorage.setItem('codename', newName)
      setCodename(newName)
    }

    setIsLoggedIn(true)
  }

  const handleGenerateNewCodename = () => {
    const newName = generateCodename()
    localStorage.setItem('codename', newName)
    setCodename(newName)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <main className="app">
      <section className="card">
        <h1>Koodinimigeneraattori</h1>
        <p className="lead">
          Kirjaudu sisään, niin sovellus hakee tallennetun koodinimen tai luo
          sinulle uuden.
        </p>

        {!isLoggedIn ? (
          <button className="button button-primary" onClick={handleLogin}>
            Kirjaudu sisään
          </button>
        ) : (
          <div className="logged-in-view">
            <p className="label">Sinun koodinimesi</p>
            <p className="codename">{codename}</p>

            <div className="actions">
              <button
                className="button button-primary"
                onClick={handleGenerateNewCodename}
              >
                Luo uusi koodinimi
              </button>
              <button className="button button-ghost" onClick={handleLogout}>
                Kirjaudu ulos
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
