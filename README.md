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