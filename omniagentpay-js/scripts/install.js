const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PACKAGE_VERSION = require('../package.json').version;
const BIN_DIR = path.join(__dirname, '../bin');
const BIN_NAME = process.platform === 'win32' ? 'omniagentpay-server.exe' : 'omniagentpay-server';
const BIN_PATH = path.join(BIN_DIR, BIN_NAME);

// Mapping of platform/arch to GitHub Release asset names
const REPO = 'omniagentpay/omniagentpay';

function getAssetUrl() {
    const platform = process.platform;
    const arch = process.arch;

    // TODO: Customize this matching based on actual PyInstaller artifacts
    // For now, assume a generic linux-x64 for Linux, etc.
    let assetName = '';

    if (platform === 'linux' && arch === 'x64') {
        assetName = 'omniagentpay-server-linux-x64';
    } else if (platform === 'darwin' && arch === 'arm64') {
        // macOS ARM - need to build separately or use x64 via Rosetta
        assetName = 'omniagentpay-server-darwin-x64';
    } else if (platform === 'darwin' && arch === 'x64') {
        assetName = 'omniagentpay-server-darwin-x64';
    } else if (platform === 'win32' && arch === 'x64') {
        assetName = 'omniagentpay-server-win-x64.exe';
    } else {
        throw new Error(`Unsupported platform: ${platform}-${arch}`);
    }

    return `https://github.com/${REPO}/releases/download/v${PACKAGE_VERSION}/${assetName}`;
}

function downloadBinary() {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    // Skip download if we are in local development (detected by presence of dist/ folder in root)
    // and symlink instead? 
    // Actually, for "npm install" from registry, dev files won't exist.
    // For local "npm install", we might want to copy.

    // Check for local build first (Development Mode)
    const localBuild = path.resolve(__dirname, '../../dist', BIN_NAME);
    if (fs.existsSync(localBuild)) {
        console.log('[omniagentpay] Found local build, copying...');
        fs.copyFileSync(localBuild, BIN_PATH);
        fs.chmodSync(BIN_PATH, 0o755);
        console.log('[omniagentpay] Local binary ready.');
        return;
    }

    // Production Mode: Download from GitHub
    const url = getAssetUrl();
    console.log(`[omniagentpay] Downloading binary from ${url}...`);

    const file = fs.createWriteStream(BIN_PATH);
    https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
            // Handle redirects
            https.get(response.headers.location, (redirectResponse) => {
                if (redirectResponse.statusCode !== 200) {
                    console.error(`[omniagentpay] Failed to download binary: ${redirectResponse.statusCode}`);
                    process.exit(1);
                }
                redirectResponse.pipe(file);
                file.on('finish', () => {
                    file.close();
                    fs.chmodSync(BIN_PATH, 0o755);
                    console.log('[omniagentpay] Binary installed successfully.');
                });
            });
        } else if (response.statusCode !== 200) {
            console.error(`[omniagentpay] Failed to download binary: ${response.statusCode}`);
            console.error('If this is a new release, the binary might not be uploaded yet.');
            process.exit(1);
        } else {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                fs.chmodSync(BIN_PATH, 0o755);
                console.log('[omniagentpay] Binary installed successfully.');
            });
        }
    }).on('error', (err) => {
        fs.unlink(BIN_PATH, () => { }); // Delete partial file
        console.error(`[omniagentpay] Download error: ${err.message}`);
        process.exit(1);
    });
}

downloadBinary();
