const h1Text = "Welcome to Thealcohesion Space Native Kiosk";
const pText = "The Secured Decoupled Enclave Architecture";

let osReady = false;

function typewriter(elementId, text, speed, callback) {
    let i = 0;
    const element = document.getElementById(elementId);
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// Start sequence
window.onload = () => {
    typewriter("typewriter-h1", h1Text, 50, () => {
        typewriter("typewriter-p", pText, 30, () => {
            checkSystemStatus();
        });
    });
};

const iframe = document.getElementById('os-frame');
const enterBtn = document.getElementById('enter-btn');
const errorMsg = document.getElementById('error-msg');

// Monitor Iframe loading
iframe.onload = () => { osReady = true; };

function checkSystemStatus() {
    if (!navigator.onLine) {
        errorMsg.innerText = "You are not connected to the internet, please check your connection";
        enterBtn.classList.add('hidden-element');
    } else if (!osReady) {
        errorMsg.innerText = "Kiosk not ready";
        setTimeout(checkSystemStatus, 1000); // Re-check readiness
    } else {
        errorMsg.innerText = "";
        enterBtn.classList.remove('hidden-element');
    }
}

// Enter Button Functionality
enterBtn.addEventListener('click', () => {
    // Reveal the OS by showing the frame or navigating
    window.location.href = "os-index.html"; 
});

// Real-time Offline Check
window.addEventListener('offline', checkSystemStatus);
window.addEventListener('online', checkSystemStatus);