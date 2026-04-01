import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ethiBanner from './assets/ethi-clo.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="top-buttons">
        <button onClick={() => console.log("Test 1 clicked")}>Test 1</button>
        <button onClick={() => console.log("Test 2 clicked")}>Test 2</button>
        <button onClick={() => console.log("Test 3 clicked")}>Test 3</button>
      </div>

      <div className="hero-banner">
        <div className="banner-content">
          <img src={ethiBanner} className="banner" alt="Ethi banner" />
        </div>
      </div>   

      <div className="scan-container">
        <button className="scan-button">Scan</button>
      </div>

      {/*<div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>*/}

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
