const crypto = require('crypto');
const fs = require('fs');

// Password to use for encryption
const password = 'MySecretPassword';

// Path to the file to be encrypted
const filePath = '/path/to/myfile.txt';

// Read the contents of the file
const fileContents = fs.readFileSync(filePath);

// Generate a random initialization vector
const iv = crypto.randomBytes(16);

// Create a cipher object with the password and initialization vector
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(password), iv);

// Encrypt the contents of the file with the cipher
let encrypted = cipher.update(fileContents);
encrypted = Buffer.concat([encrypted, cipher.final()]);

// Write the encrypted data to a new file
const encryptedFilePath = '/path/to/myfile-encrypted.txt';
fs.writeFileSync(encryptedFilePath, iv.toString('hex') + ':' + encrypted.toString('hex'));
