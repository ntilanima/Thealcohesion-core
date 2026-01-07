const titleText = "Welcome to Thealcohesion Space Native Kiosk"
const subtitleText = "The Secured Decoupled Enclave Architecture"

const titleEl = document.getElementById('title')
const subtitleEl = document.getElementById('subtitle')
const statusEl = document.getElementById('status')
const enterBtn = document.getElementById('enter')
const osFrame = document.getElementById('os-frame')

let osReady = false

// TYPEWRITER
function type(el, text, speed = 40) {
  let i = 0
  const interval = setInterval(() => {
    el.textContent += text[i++]
    if (i === text.length) clearInterval(interval)
  }, speed)
}

type(titleEl, titleText)
setTimeout(() => type(subtitleEl, subtitleText, 30), 1200)

// INTERNET CHECK
function updateNetwork() {
  if (!window.kiosk.isOnline()) {
    statusEl.textContent = "You are not connected to the internet, please check your connection"
    return false
  }
  return true
}

// OS READY CHECK
osFrame.onload = () => {
  osReady = true
  if (updateNetwork()) {
    statusEl.textContent = "Kiosk ready"
    enterBtn.disabled = false
  }
}

// ENTER BUTTON
enterBtn.onclick = () => {
  if (!osReady) {
    statusEl.textContent = "Kiosk not ready"
    return
  }

  document.getElementById('kiosk').style.display = 'none'
  osFrame.style.display = 'block'
  osFrame.style.width = '100vw'
  osFrame.style.height = '100vh'
}
