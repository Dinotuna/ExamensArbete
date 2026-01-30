import { useState } from "react";
import "./App.css";

function App() {
  const [currentPitch, setCurrentPitch] = useState(null);
  const [targetPitch, setTargetPitch] = useState(null); 

  let michropheSteam = null;
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
    let audioCtx = new window.AudioContext();
    let analyserNode = audioCtx.createAnalyser();

    analyserNode.fftSize = 8192;

    let audioData = new Float32Array(analyserNode.fftSize);
    let correlatedSignal = new Float32Array(analyserNode.fftSize);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        let michropheStream = audioCtx.createMediaStreamSource(stream);
        michropheStream.connect(analyserNode);
        let frequencyDisplayElement = document.querySelector("#frequency");
        let noteDisplayElement = document.querySelector("#note");

        setInterval(() => {
          analyserNode.getFloatTimeDomainData(audioData);

          let pitch = getAutocorrelatedPitch(analyserNode, audioData, correlatedSignal, audioCtx);
          setCurrentPitch(pitch);

          if (frequencyDisplayElement) {
            frequencyDisplayElement.innerHTML =
              pitch != null ? pitch.toFixed(1) : "0.0";
          }
          if (noteDisplayElement) {
            const note = pitch != null ? frequencyToNote(pitch) : ". . .";
            noteDisplayElement.innerHTML = note;
          }
        }, 40);
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

function getAutocorrelatedPitch(analyserNode, audioData, correlatedSignal, audioCtx) {

    let rms = 0;
    for (let i = 0; i < audioData.length; i++) rms += audioData[i] * audioData[i];
    if (Math.sqrt(rms / audioData.length) < 0.01) return null;


    for (let l = 0; l < analyserNode.fftSize; l++) {
      correlatedSignal[l] = 0;
      for (let i = 0; i + l < analyserNode.fftSize; i++) {
        correlatedSignal[l] += audioData[i] * audioData[i + l];
      }
    }


    let d = 0;
    while (correlatedSignal[d] > correlatedSignal[d + 1]) d++;

    let maxValue = -1;
    let maxLag = -1;
    for (let i = d; i < analyserNode.fftSize; i++) {
      if (correlatedSignal[i] > maxValue) {
        maxValue = correlatedSignal[i];
        maxLag = i;
      }
    }


    if (maxLag !== -1) {
      return audioCtx.sampleRate / maxLag;
    }
    return null;
    }
  

  function getTuningStatus() {
    if (!targetPitch)  return "Välj en sträng";
    if (!currentPitch) return "Spela en ton";

    const difference = currentPitch - targetPitch;

    if (Math.abs(difference) < 1) return "Strängen är stämd";
    if (difference > 0) return `+ ${Math.round(difference)}`;
    return `${Math.round(difference)}`;

  }

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
        <p id="tuningStatus">{getTuningStatus()}</p>
        <button onClick={() => setTargetPitch(82.41)}>E</button>
        <button onClick={() => setTargetPitch(110.00)}>A</button>
        <button onClick={() => setTargetPitch(146.83)}>D</button>
        <button onClick={() => setTargetPitch(196.00)}>G</button>
        <button onClick={() => setTargetPitch(246.94)}>B</button>
        <button onClick={() => setTargetPitch(329.63)}>E</button>
      </div>
    </div>
  );
}

export default App;
