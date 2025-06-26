const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 24, 32, 48, 64, 128, 256];
const inputSvg = path.join(__dirname, '..', 'assets', 'icon.svg');
const outputIco = path.join(__dirname, '..', 'assets', 'icon.ico');

async function generateIco() {
  // Generar PNG para cada tamaño
  const pngBuffers = await Promise.all(
    sizes.map(size => 
      sharp(inputSvg)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Crear archivo ICO
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // Reserved
  header.writeUInt16LE(1, 2);  // ICO type
  header.writeUInt16LE(sizes.length, 4);  // Number of images

  let offset = 6 + (sizes.length * 16);  // Header size + Directory size
  const directory = Buffer.alloc(sizes.length * 16);
  const imageBuffers = [];

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const buffer = pngBuffers[i];

    // Write directory entry
    directory.writeUInt8(size, i * 16);  // Width
    directory.writeUInt8(size, i * 16 + 1);  // Height
    directory.writeUInt8(0, i * 16 + 2);  // Color palette
    directory.writeUInt8(0, i * 16 + 3);  // Reserved
    directory.writeUInt16LE(1, i * 16 + 4);  // Color planes
    directory.writeUInt16LE(32, i * 16 + 6);  // Bits per pixel
    directory.writeUInt32LE(buffer.length, i * 16 + 8);  // Image size
    directory.writeUInt32LE(offset, i * 16 + 12);  // Image offset

    offset += buffer.length;
    imageBuffers.push(buffer);
  }

  // Combine all buffers
  const finalBuffer = Buffer.concat([header, directory, ...imageBuffers]);
  fs.writeFileSync(outputIco, finalBuffer);
  console.log('ICO file generated successfully!');
}

generateIco().catch(console.error); 