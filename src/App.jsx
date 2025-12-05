import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const startPitchDetection = () => {
    navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
    })
    .catch((err) => {
      console.log("Kunde inte få mikrofonen");
    })
  }

  return (
    <div>

      <button onClick={startPitchDetection}>Fråga om mikrofon </button>

    </div>
  )
}

export default App
