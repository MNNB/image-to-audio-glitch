const { WaveFile } = require('wavefile');

let audioContext;
let glitchBuffer;

const imageInput = document.getElementById('imageInput');
const imageCanvas = document.getElementById('imageCanvas');
const generateBtn = document.getElementById('generateBtn');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const exportBtn = document.getElementById('exportBtn');
const sampleRateInput = document.getElementById('sampleRate');
const intensityInput = document.getElementById('glitchIntensity');

let source;

imageInput.addEventListener('change', loadImage);
generateBtn.addEventListener('click', generateGlitch);
playBtn.addEventListener('click', playGlitch);
stopBtn.addEventListener('click', stopGlitch);
exportBtn.addEventListener('click', exportWav);

function loadImage(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;
      const ctx = imageCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(file);
}

function generateGlitch() {
  const ctx = imageCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  const data = imageData.data;

  const sampleRate = parseInt(sampleRateInput.value);
  const intensity = parseInt(intensityInput.value) / 100;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = imageCanvas.width * imageCanvas.height;
  glitchBuffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const channelData = glitchBuffer.getChannelData(0);

  for (let i = 0, j = 0; i < bufferSize; i++, j += 4) {
    // Convert to grayscale and normalize to [-1, 1]
    const gray = (data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114) / 255;
    channelData[i] = (gray * 2 - 1) * intensity;

    // Add some glitch effects
    if (Math.random() < 0.01) {
      // Sudden amplitude change
      channelData[i] *= 5;
    }
    if (Math.random() < 0.005) {
      // Short repetition
      const repetitionLength = Math.floor(Math.random() * 100);
      for (let k = 0; k < repetitionLength && i + k < bufferSize; k++) {
        channelData[i + k] = channelData[i];
      }
      i += repetitionLength;
    }
  }

  alert('Glitch audio generated!');
}

function playGlitch() {
  if (!glitchBuffer) {
    alert('Generate a glitch first!');
    return;
  }

  stopGlitch();

  source = audioContext.createBufferSource();
  source.buffer = glitchBuffer;
  source.connect(audioContext.destination);
  source.start();
}

function stopGlitch() {
  if (source) {
    source.stop();
  }
}

function exportWav() {
  if (!glitchBuffer) {
    alert('Generate a glitch first!');
    return;
  }

  const wav = new WaveFile();

  // Convert AudioBuffer to Int16Array
  const intData = new Int16Array(glitchBuffer.length);
  const floatData = glitchBuffer.getChannelData(0);
  for (let i = 0; i < floatData.length; i++) {
    intData[i] = floatData[i] < 0 ? floatData[i] * 0x8000 : floatData[i] * 0x7FFF;
  }

  wav.fromScratch(1, audioContext.sampleRate, '16', intData);

  const buffer = wav.toBuffer();

  // Create a Blob from the buffer
  const blob = new Blob([buffer], { type: 'audio/wav' });

  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'image_glitch_audio.wav';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}