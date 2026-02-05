const pointer = document.createElement('div');
pointer.id = 'custom-pointer';
document.body.appendChild(pointer);

let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX - 15;
    mouseY = e.clientY - 15;
});

function animatePointer() {
    pointer.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    requestAnimationFrame(animatePointer);
}
animatePointer();


    const getArchitecture = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform || ""; // Fallback
        
        // 1. Check for Mobile
        if (/android/i.test(ua)) return "Android";
        if (/iPad|iPhone|iPod/.test(ua)) return "iOS";

        // 2. Check for Windows
        if (/Win/i.test(platform) || /Windows/i.test(ua)) {
            if (/x64|Win64|WOW64/i.test(ua)) return "Windows x64";
            return "Windows x32";
        }

        // 3. Check for Mac (Intel vs ARM)
        if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
            // Modern Macs (Apple Silicon) often report 'MacIntel' but have 0 maxTouchPoints
            const isAppleSilicon = navigator.maxTouchPoints > 0 || (typeof Deno !== 'undefined');
            return isAppleSilicon ? "macOS ARM" : "macOS Intel";
        }

        // 4. Check for Linux
        if (/Linux/i.test(platform) || /Linux/i.test(ua)) return "Linux";

        return "Sovereign Core (Unknown)";
    };

// Enforce digits-only input for phone fields
document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = document.querySelectorAll('#m-phone');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Remove any non-digit characters
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            // Enforce max length of 15
            if (e.target.value.length > 15) {
                e.target.value = e.target.value.slice(0, 15);
            }
        });
    });
});

// Handle the Interest Form
document.getElementById('interest-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = {
        name: e.target[0].value,
        country: e.target[1].value,
        phone: e.target[2].value,
        email: e.target[3].value,
        reason: e.target[4].value
    };

    const res = await fetch('http://localhost:3000/api/spacs/interest', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
    });
    const data = await res.json();
    alert(data.message || data.error);
    if(data.success) closeAllModals();
};

// Handle Verify & Provision (Form B)
document.getElementById('provision-form').onsubmit = async (e) => {
    e.preventDefault();
        // VALIDATION FIRST
    const phoneBase = document.getElementById('m-phone').value.trim();
    const countryCode = document.getElementById('m-country-code').value;

    if (!/^[0-9]{7,15}$/.test(phoneBase)) {
        alert("INVALID PHONE");
        return;
    }
    if (!countryCode) {
        alert("MISSING COUNTRY CODE");
        return;
    }
    const btn = e.submitter;
    const originalText = btn.innerText;
    
    // UI Feedback
    btn.disabled = true;
    btn.innerText = "AUTHENTICATING...";
    const archValue = osMapping[selectedClass] || getArchitecture();
    localStorage.setItem('pending_arch', archValue);
    const payload = {
        name: document.getElementById('m-name').value,       
        license: document.getElementById('m-license').value,
        membership_no: document.getElementById('m-no').value,
        phone: document.getElementById('m-phone').value,     
        email: document.getElementById('m-email').value,     
        country: document.getElementById('m-country').value, 
        hw_id: localStorage.getItem('vpu_hw_id'),
        arch: archValue
    };

    try {
        const res = await fetch('http://localhost:3000/api/spacs/verify-provision', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            // 1. CLEAR THE SECURITY TIMER (from the HTML script)
            if (typeof countdown !== 'undefined') clearInterval(countdown);
            
            // 2. CLOSE THE INPUT MODAL
            closeAllModals();

            // 3. TRIGGER THE VISUAL TERMINAL SEQUENCE
            // Pass the data to the function in your HTML
            if (typeof startProvisioningSequence === 'function') {
                const selectedOS = localStorage.getItem('pending_arch') || 'Unknown OS';
                startProvisioningSequence(payload.name, payload.license, selectedOS, data.shell_url);
            } else {
                // Fallback if sequence function is missing
                alert("PROVISIONING SUCCESSFUL. STARTING DOWNLOAD.");
                window.location.href = data.shell_url;
            }
            
        } else {
            btn.disabled = false;
            btn.innerText = "VERIFICATION FAILED";
            alert("SEC_ERROR: " + (data.error || "Identity Mismatch"));
            setTimeout(() => { btn.innerText = originalText; }, 2000);
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerText = "BRIDGE_OFFLINE";
        alert("CRITICAL: Connection to Sovereign Bridge failed.");
        console.error("Fetch Error:", err);
    }

    // 2. COMBINE FOR SOVEREIGN IDENTITY
    const fullPhone = `${countryCode}${phoneBase}`;
    console.log("Verified Identity String:", fullPhone);

    // Proceed to check License Key as before
    const licenseKey = document.getElementById('m-license').value.toUpperCase();
    if (licenseKey.startsWith('SOV-') && licenseKey.length > 8) {
        // Valid - trigger sequence
        startProvisioningSequence(memberName, licenseKey);
    }

    const phoneInput = document.getElementById('m-phone');

    phoneInput.oninput = (e) => {
        // Automatically remove any non-digit characters as the user types
        e.target.value = e.target.value.replace(/\D/g, '');
    };

    // Check length on submit
    if (phoneInput.value.length < 7) {
        alert("INVALID PHONE: Number is too short for Sovereign validation.");
        return false;
    }

    const phoneInputs = document.querySelectorAll('input[type="tel"]');

    phoneInputs.forEach(input => {
        // 1. PREVENT typing non-digits
        input.addEventListener('keydown', (e) => {
            // Allow: Backspace, Tab, Enter, Escape, Arrow keys
            const allowKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Delete'];
            
            if (allowKeys.includes(e.key)) {
                return; // Let it happen
            }

            // Block if the key is NOT a number (0-9)
            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // 2. CATCH Paste attempts (e.g. if they copy-paste "ABC-123")
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });
};

// Map button classes to OS signatures
const osMapping = {
    'btn-win': 'Win32',
    'btn-mac': 'Darwin',
    'btn-linux': 'Linux',
    'btn-android': 'Android',
    'btn-ios': 'iOS'
};

// Unified listener: This handles Windows, Linux, Mac, etc.
document.querySelectorAll('.btn-dist').forEach(button => {
    button.onclick = (e) => {
        e.preventDefault();
        
        // 1. Capture/Ensure HW ID
        if (!localStorage.getItem('vpu_hw_id')) {
            const fingerprint = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem('vpu_hw_id', fingerprint);
        }

        // 2. Store selected architecture
        const selectedClass = [...button.classList].find(cls => osMapping[cls]);
        localStorage.setItem('pending_arch', osMapping[selectedClass] || navigator.platform);

        // 3. FIXED: Open the modal using the ID present in your HTML
        const modal = document.getElementById('member-modal'); 
        if(modal) {
            modal.style.display = 'flex';
            if (typeof startTimeoutTimer === 'function') startTimeoutTimer();
        }
    };
});