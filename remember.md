//add this guard clause: to prevent locked member from loging in
login(uid) {
    const user = MEMBER_LIST.find(m => m.security.uid === uid);
    if (user && user.isFrozen) {
        throw new Error("IDENTITY_LOCKED: Your account has been frozen.");
    }
    // Proceed with login...
}

--------------------------------------------------------------


Decision Tree & Outcomes on landing.html

Following the "handshake" with the vpu-bridge.js, the system makes one of four critical decisions:
Outcome	Trigger Condition	System Action
IDENTITY_REVOKED	revoked flag is TRUE in the database.	Panic Triggered: Red HUD overlay appears, an audible alarm plays, and triggerRealPanic is executed to lock the VPU.
PROVISIONED	enclave_attested is TRUE and a user_name is linked.	Bypass Ingress: The sniffer recognizes the machine as a trusted device and automatically redirects to the main OS kernel (index.html).
ARCH_LOCKED	The machine's OS matches an existing bound architecture for that identity.	Access Denied: Prevents "Architecture Duplication" where one identity tries to claim multiple machines of the same OS type.
INITIAL_PROVISION	No record found in the database.	Auto-Registration: The bridge logs the hardware hash as a "CANDIDATE" and admits the user to the provisioning terminal (download.html).
Security Observations

    Forensic Buffer: The sniffer uses artificial delays (e.g., 800ms for "ISOLATING_HARDWARE_SIG") to ensure the user perceives the depth of the security check.

    Bridge Resiliency: If the bridge is offline, the sniffer catches the fetch error and displays "BRIDGE_OFFLINE" rather than crashing the frontend.

    Silent Enrollment: If a machine is unknown, it is silently inserted into the security_device table with enclave_attested = FALSE, allowing administrators to review new candidates.