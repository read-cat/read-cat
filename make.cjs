const fs = require('fs');
const createMetadata = require('./metadata.cjs');
const metadata = createMetadata();
console.log('metadata:', metadata);
fs.writeFileSync('metadata.json', JSON.stringify(metadata), { encoding: 'utf-8' });