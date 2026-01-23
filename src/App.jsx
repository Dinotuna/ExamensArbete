import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [currentPitch, setCurrentPitch] = useState(null);
  let audioCtx = new window.AudioContext();
  let michropheSteam = null;
  let analyserNode = audioCtx.createAnalyser();
  let audioData = new Float32Array(analyserNode.fftSize);
  let correlatedSignal = new Float32Array(analyserNode.fftSize);
  let localMaxima = new Array(10);
  let frequencyDisplayElement = null;
  let noteDisplayElement = null;
  const noteStrings = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const startPitchDetection = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        michropheSteam = audioCtx.createMediaStreamSource(stream);
        michropheSteam.connect(analyserNode);

        audioData = new Float32Array(analyserNode.fftSize);
        correlatedSignal = new Float32Array(analyserNode.fftSize);

        frequencyDisplayElement = document.querySelector("#frequency");
        noteDisplayElement = document.querySelector("#note");

        setInterval(() => {
          analyserNode.getFloatTimeDomainData(audioData);

          let pitch = getAutocorrelatedPitch();
          setCurrentPitch(pitch);

          if (frequencyDisplayElement) {
            frequencyDisplayElement.innerHTML =
              pitch != null ? pitch.toFixed(0) : "0.0";
          }
          if (noteDisplayElement) {
            const note = pitch != null ? frequencyToNote(pitch) : ". . .";
            noteDisplayElement.innerHTML = note;
          }
        }, 300);
      })
      .catch((err) => {
        console.log("Kunde inte få mikrofonen");
      });
  };

  function frequencyToNote(freq) {
    if (!freq || freq <= 0) return "--";
    const noteNumber = 12 * Math.log2(freq / 440) + 69;
    const rounded = Math.round(noteNumber);
    const noteName = noteStrings[(rounded + 120) % 12];
    return `${noteName}`;
  }

  function getAutocorrelatedPitch() {
    let maximaCount = 0;

    for (let l = 0; l < analyserNode.fftSize; l++) {
      correlatedSignal[l] = 0;
      for (let i = 0; i + l < analyserNode.fftSize; i++) {
        correlatedSignal[l] += audioData[i] * audioData[i + l];
      }
      if (l > 1) {
        if (
          correlatedSignal[l - 2] - correlatedSignal[l - 1] < 0 &&
          correlatedSignal[l - 1] - correlatedSignal[l] > 0
        ) {
          localMaxima[maximaCount] = l - 1;
          maximaCount++;
          if (maximaCount >= localMaxima.length) break;
        }
      }
    }

    if (maximaCount === 0) return null;
    if (maximaCount === 1) return audioCtx.sampleRate / localMaxima[0];

    let sumDiffs = 0;
    for (let i = 1; i < maximaCount; i++) {
      sumDiffs += localMaxima[i] - localMaxima[i - 1];
    }
    const meanLag = sumDiffs / (maximaCount - 1);
    if (meanLag <= 0) return null;
    let currentPitch = audioCtx.sampleRate / meanLag;
    return currentPitch;
  }

  function tuneGuitarString () {
    console.log(currentPitch);
  }

  tuneGuitarString()

  return (
    <div>
      <div>
        <h1>Frekvens</h1>
        <h2 id="frequency">0.0</h2>
        <h3 id="note">. . .</h3>
      </div>

      <button onClick={startPitchDetection}>Fråga om mikrofon </button>

      <div>
        <h1>Stämmare</h1>
        <button onClick={tuneGuitarString} id="82">E</button>
        <button id="110">A</button>
        <button id="147">D</button>
        <button id="196">G</button>
        <button id="247">B</button>
        <button id="330">E</button>
      </div>
    </div>
  );
}

export default App;
