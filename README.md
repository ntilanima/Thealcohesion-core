# Thealcohesion Cloud OS (Kernel Core)

Thealcohesion is a high-performance, from-scratch Cloud Operating System built to manage decentralized resources and secure **Investor Allotments**. 

Inspired by industry-leading cloud architectures, this kernel implements strict resource guarding, local-first persistence, and secure cross-origin communication.

## 🚀 Key Architectural Best Practices

### 1. Asynchronous Kernel Initialization
Utilizing a "Promise-Gate" pattern (see `kernel.js`), the system ensures that the Virtual File System (VFS) and Session Authentication are fully "hydrated" before the UI or any third-party apps are permitted to execute.

### 2. Strict Allotment Enforcement (Quota Guard)
Every write operation to the VFS undergoes a "Pre-flight check." By separating file metadata from content, the kernel validates that the transaction fits within the user's **Initial Allotment** (e.g., 10GB Gold Tier) before a single byte is written to IndexedDB or the Cloud.

### 3. Origin-Based Security Handshaking
To protect investor data, the SDK employs strict origin validation. Only authorized subdomains within the `thealcohesion.com` ecosystem can exchange messages with the kernel, preventing cross-site scripting (XSS) and data leakage.

## 📂 File Structure

- **`kernel.js`**: The BIOS/Core of the OS. Handles booting, auth, and security.
- **`vfs.js`**: The Virtual File System. Manages storage logic and allotment tracking.
- **`sdk.js`**: The developer-facing API (`thealcohesion.fs`, `thealcohesion.ui`).
- **`schema.sql`**: Database definitions for multi-tenant allotment management.

## 🛠 Getting Started

1. **Clone the Repo:**
   `git clone https://github.com/YOUR_USERNAME/thealcohesion-core.git`

2. **Initialization:**
   Include `kernel.js`, `vfs.js`, and `sdk.js` in your main entry point. The kernel will automatically trigger the `boot()` sequence.

3. **Check Allotment:**
   ```javascript
   const usage = await thealcohesion.fs.getUsage();
   console.log(`Remaining Allotment: ${usage.total - usage.used} bytes`);


Thealcohesion Core: Sovereign Operating Environment
"I am because we are."

Thealcohesion Core is a private, identity-gated Virtual Pragmatic Universe (VPU). It is built to operate as a secure and humane alternative to extractive digital platforms, focusing on collective resource pooling, mediation, and sovereign utility.
1. Architectural Principles

    Identity First: No function, app, or resource is accessible without a verified membership identity.

    Zero-Knowledge Privacy: All member data is encrypted client-side using AES-GCM. The system provides the space (Utility) but has no visibility into the content (Privacy).

    Role-Based Access (RBAC): Capabilities are granted based on service roles: Builder, Mediator, Innovator, Steward, and Guardian.

2. Core Components
Component	Responsibility
auth.js	Key derivation (PBKDF2) and identity verification.
kernel.js	The "Brain." Manages session states, role enforcement, and emergency lockdown.
vfs.js	The "Utility." Enforces the 5GB baseline and handles AES-GCM encryption.
ui.js	The "Shell." Implements the Ubuntu-aligned, non-extractive interface.
3. The Sovereign Utility (VFS)

The system treats storage as a shared resource.

    Baseline: 5 GB for every verified member.

    Sustainability Tiers: Seed (+10GB), Grove (+50GB), Canopy (+200GB), Forest (+1TB).

    The 20% Margin: All contributions include a 20% margin to fund collective infrastructure.

4. Developer Prohibitions (Binding)

Per Section 15.11 of the Charter, developers are strictly prohibited from:

    Adding Analytics: No tracking, no pixels, no telemetry.

    Advertising: No monetization or extractive attention patterns.

    Public Endpoints: No data may leave the VPU unless explicitly authorized by the Values Council.

    Bypassing the Gate: No "backdoors" for administrators.

5. Deployment & Governance

The Core is designed to be hosted on private, sovereign infrastructure (e.g., a private VPS).

    Emergency Lockdown: In the event of a breach, a Guardian can trigger a global system freeze via the kernel.triggerEmergencyLockdown() method.

    Updates: Any change to the Core logic must be reviewed by the Values Council and logged in the Audit Dashboard.

6. Development Philosophy

    "Developers are not building a product for users. They are implementing a governed collective operating environment. Technical decisions must always defer to the Charter."