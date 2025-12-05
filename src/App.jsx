import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  let audioCtx = new window.AudioContext();
  let michropheSteam = null;
  let analyserNode = audioCtx.createAnalyser();
  let audioData = new Float32Array(analyserNode.fftSize);
  let correlatedSignal = new Float32Array(analyserNode.fftSize);
  let localMaxima = new Array(10);
  let frequencyDisplayElement = null

  const startPitchDetection = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        michropheSteam = audioCtx.createMediaStreamSource(stream);
        michropheSteam.connect(analyserNode);

        audioData = new Float32Array(analyserNode.fftSize);
        correlatedSignal = new Float32Array(analyserNode.fftSize);

        frequencyDisplayElement = document.querySelector("#frequency");

        setInterval(() => {
          analyserNode.getFloatTimeDomainData(audioData);

          let pitch = getAutocorrelatedPitch();


          if (frequencyDisplayElement) {
            frequencyDisplayElement.innerHTML = pitch != null ? `${pitch}` : "0.0;"
          }

        }, 300);
      })
      .catch((err) => {
        console.log("Kunde inte få mikrofonen");
      });
  };

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
    return audioCtx.sampleRate / meanLag;

  }

  return (
    <div>
      <h1>Frekvens</h1>
      <h2 id="frequency">0.0</h2>

      <button onClick={startPitchDetection}>Fråga om mikrofon </button>
    </div>
  );
}

export default App;
