const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const colors = document.querySelectorAll(".color");
let selectedColor = 'red'; // Default color

// Grid size and pixel size
// const gridSize = 100;
const pixelSize = canvas.height / gridSize;
// const pixelSize = 300;
console.log("Pixel size:", pixelSize);


// Add click event to each color
colors.forEach((color) => {
    color.addEventListener('click', () => {
        selectedColor = color.style.backgroundColor;
    });
});


// Websockets stuff
var socket = io();

socket.on('connect', function() {
    console.log('Connected to WebSocket');
});

socket.on('draw', function(data) {
    console.log('Response received:', data);
});

// Draw a pixel
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    ctx.fillStyle = selectedColor;

    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    socket.emit('draw', {x: x, y: y, color: selectedColor});
});
