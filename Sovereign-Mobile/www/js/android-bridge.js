// This ensures your OS code doesn't crash when looking for 'vpu'
if (!window.vpu) {
    window.vpu = {
        bootOS: async () => {
            console.log("Mobile Shell: Already in Core.");
            return { success: true };
        },
        verifyAllotment: async (key) => {
            // Capacitor can talk to Native Storage here
            const val = localStorage.getItem('native_id');
            return { system: "Mobile-Enclave", active: !!val };
        }
    };
}