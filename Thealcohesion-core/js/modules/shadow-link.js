/**
 * shadow-link.js
 * SOVEREIGN_P2P_LINK // MANUAL_SIGNALING
 */
export class ShadowLink {
    constructor(onMessageReceived, onStatusChange) {
        this.config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
        this.peer = new RTCPeerConnection(this.config);
        this.dataChannel = null;
        this.onMessage = onMessageReceived;
        this.onStatus = onStatusChange;

        // Listen for incoming data channels (for the Investor side)
        this.peer.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupChannelEvents();
        };
    }

    // ARCHON: Step 1 - Generate Offer
    async createOffer() {
        this.dataChannel = this.peer.createDataChannel("shadow-transfer");
        this.setupChannelEvents();
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return new Promise((resolve) => {
            this.peer.onicecandidate = (e) => {
                if (!e.candidate) resolve(btoa(JSON.stringify(this.peer.localDescription)));
            };
        });
    }

    // INVESTOR: Step 2 - Accept Offer and Generate Answer
    async acceptOffer(encodedOffer) {
        const offer = JSON.parse(atob(encodedOffer));
        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        return new Promise((resolve) => {
            this.peer.onicecandidate = (e) => {
                if (!e.candidate) resolve(btoa(JSON.stringify(this.peer.localDescription)));
            };
        });
    }

    // ARCHON: Step 3 - Finalize Link
    async finalizeLink(encodedAnswer) {
        const answer = JSON.parse(atob(encodedAnswer));
        await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    }

    setupChannelEvents() {
        this.dataChannel.onopen = () => this.onStatus("LINK_ESTABLISHED");
        this.dataChannel.onclose = () => this.onStatus("LINK_TERMINATED");
        this.dataChannel.onmessage = (e) => this.onMessage(e.data);
    }

    /**
     * UPDATED SEND LOGIC
     * Handles large image strings by breaking them into 16KB chunks
     */
    send(data) {
        if (this.dataChannel?.readyState !== "open") return;

        const CHUNK_SIZE = 16384; 
        const stringData = data.toString();
        
        // Protocol markers
        this.dataChannel.send("START_TRANSMISSION");

        for (let i = 0; i < stringData.length; i += CHUNK_SIZE) {
            this.dataChannel.send(stringData.slice(i, i + CHUNK_SIZE));
        }

        this.dataChannel.send("END_TRANSMISSION");
    }


    sendLargeData(data) {
    const CHUNK_SIZE = 16384; // 16KB chunks
    const stringData = data.toString();
    
    // Send a "Start" signal
    this.dataChannel.send("START_TRANSMISSION");

    for (let i = 0; i < stringData.length; i += CHUNK_SIZE) {
        this.dataChannel.send(stringData.slice(i, i + CHUNK_SIZE));
    }

    // Send an "End" signal
    this.dataChannel.send("END_TRANSMISSION");
}
}