const fs = require('fs');
const path = require('path');

const type = process.argv[2] || 'patch';
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const [major, minor, patch] = packageJson.version.split('.').map(Number);

switch (type) {
    case 'major':
        packageJson.version = `${major + 1}.0.0`;
        break;
    case 'minor':
        packageJson.version = `${major}.${minor + 1}.0`;
        break;
    case 'patch':
    default:
        packageJson.version = `${major}.${minor}.${patch + 1}`;
        break;
}

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`Version bumped to ${packageJson.version}`);
