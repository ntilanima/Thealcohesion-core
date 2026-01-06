const pointer = document.createElement('div');
pointer.id = 'custom-pointer';
document.body.appendChild(pointer);

document.addEventListener('mousemove', (e) => {
    // Subtract half the width/height (15px) to center the '+'
    const x = e.clientX - 15;
    const y = e.clientY - 15;
    
    // Using requestAnimationFrame for high-performance 60fps tracking
    requestAnimationFrame(() => {
        pointer.style.transform = `translate(${x}px, ${y}px)`;
    });
});