const fs = require('fs');
const createMetadata = require('./metadata.cjs');
console.log(createMetadata());
fs.writeFileSync('metadata.json', JSON.stringify(createMetadata()), { encoding: 'utf-8' });