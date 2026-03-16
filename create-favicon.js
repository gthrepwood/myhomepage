const fs = require('fs');
const path = require('path');

// Simple 16x16 ICO file with a blue square
// This is a minimal valid ICO file structure
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);     // Reserved
icoHeader.writeUInt16LE(1, 2);     // Type (1 = ICO)
icoHeader.writeUInt16LE(1, 4);     // Number of images

const imageEntry = Buffer.alloc(16);
imageEntry.writeUInt8(16, 0);      // Width
imageEntry.writeUInt8(16, 1);       // Height
imageEntry.writeUInt8(0, 2);        // Color palette
imageEntry.writeUInt8(0, 3);        // Reserved
imageEntry.writeUInt16LE(1, 4);     // Color planes
imageEntry.writeUInt16LE(32, 6);    // Bits per pixel
imageEntry.writeUInt32LE(1128, 8);  // Size of image data
imageEntry.writeUInt32LE(22, 12);   // Offset to image data

// BMP header for 16x16 32-bit image
const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);     // Header size
bmpHeader.writeInt32LE(16, 4);      // Width
bmpHeader.writeInt32LE(32, 8);      // Height (doubled for ICO)
bmpHeader.writeUInt16LE(1, 12);     // Planes
bmpHeader.writeUInt16LE(32, 14);    // Bits per pixel
bmpHeader.writeUInt32LE(0, 16);     // Compression
bmpHeader.writeUInt32LE(1024, 20);  // Image size
bmpHeader.writeInt32LE(0, 24);      // X pixels per meter
bmpHeader.writeInt32LE(0, 28);      // Y pixels per meter
bmpHeader.writeUInt32LE(0, 32);     // Colors used
bmpHeader.writeUInt32LE(0, 36);     // Important colors

// Create 16x16 pixel data (BGRA format, bottom-up)
// Using a nice gradient blue color #667eea -> #764ba2
const pixelData = Buffer.alloc(16 * 16 * 4);
for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        // Create gradient effect
        const t = (x + y) / 32;
        // Blue to purple gradient
        pixelData[i + 0] = Math.floor(162 * t + 234 * (1 - t));     // B
        pixelData[i + 1] = Math.floor(75 * t + 126 * (1 - t));      // G  
        pixelData[i + 2] = Math.floor(102 * t + 102 * (1 - t));    // R
        pixelData[i + 3] = 255;                                      // A
    }
}

// AND mask (16x16 bits = 32 bytes, but must be DWORD aligned = 64 bytes)
const andMask = Buffer.alloc(64, 0);

// Combine all parts
const ico = Buffer.concat([icoHeader, imageEntry, bmpHeader, pixelData, andMask]);

// Write to file
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), ico);
console.log('favicon.ico created successfully!');
