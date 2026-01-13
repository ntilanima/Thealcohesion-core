// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Run the Sovereign Shell library which handles:
    // - Fullscreen
    // - Window event interception (ESC, Alt+F4 / CloseRequested)
    // - Focus enforcement (partial Alt+Tab lockdown)
    // - Decoration removal
    sovereign_shell_lib::run()
}
