/**
 * apps/camera.js - Sovereign VPU Eye
 * Features: Live Stream, Snapshot, and Local Enclave Saving
 */
export class CameraApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
        this.stream = null;
    }

    async init() {
        this.render();
        this.startCamera();
    }

    render() {
        this.container.innerHTML = `
            <div class="camera-wrapper" style="height: 100%; background: #000; display: flex; flex-direction: column; font-family: monospace;">
                
                <div style="flex-grow: 1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <video id="camera-stream" autoplay playsinline 
                           style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); border-bottom: 2px solid #00ff41;"></video>
                    
                    <div style="position: absolute; top: 10px; left: 10px; color: #00ff41; font-size: 10px; pointer-events: none;">
                        REC [●] VPU_EYE_01<br>
                        ISO 400 | 60FPS<br>
                        ${new Date().toISOString().split('T')[0]}
                    </div>
                </div>

                <div style="height: 80px; display: flex; align-items: center; justify-content: space-around; background: #111; padding: 0 20px;">
                    <button id="shutter-btn" style="width: 50px; height: 50px; border-radius: 50%; border: 4px solid #fff; background: red; cursor: pointer; outline: none; transition: 0.2s;"
                            onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'"></button>
                    
                    <div style="color: #00ff41; font-size: 12px; text-align: center;">
                        <span id="camera-status">SYNCING...</span>
                    </div>

                    <div id="photo-preview" style="width: 50px; height: 50px; border: 1px solid #333; background: #222; background-size: cover; border-radius: 4px;"></div>
                </div>

                <canvas id="camera-canvas" style="display: none;"></canvas>
            </div>
        `;

        this.container.querySelector('#shutter-btn').onclick = () => this.takeSnapshot();
    }

    async startCamera() {
        const video = this.container.querySelector('#camera-stream');
        const status = this.container.querySelector('#camera-status');

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720 }, 
                audio: false 
            });
            video.srcObject = this.stream;
            status.innerText = "VPU_LINK_ACTIVE";
        } catch (err) {
            console.error("Camera Error:", err);
            status.innerText = "LINK_FAILED";
            status.style.color = "red";
        }
    }

    takeSnapshot() {
        const video = this.container.querySelector('#camera-stream');
        const canvas = this.container.querySelector('#camera-canvas');
        const preview = this.container.querySelector('#photo-preview');
        const context = canvas.getContext('2d');

        // Set canvas to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame
        context.translate(canvas.width, 0);
        context.scale(-1, 1); // Flip back to normal
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL('image/png');
        preview.style.backgroundImage = `url(${dataURL})`;

        // Save to Sovereign VFS (Simulated)
        this.saveToEnclave(dataURL);
    }

    saveToEnclave(data) {
        console.log("Saving snapshot to Enclave...");
        // In a real implementation, you would convert the base64 data to an 
        // ArrayBuffer and encrypt it using the session key before saving to VFS.
    }

onClose() {
    console.log("Camera: Releasing hardware resources...");
    
    // Stop every track (Video and Audio) to turn off the webcam light
    if (this.stream) {
        this.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    
    // Optional: Clear any pending timers or intervals
    this.stream = null;
}
}