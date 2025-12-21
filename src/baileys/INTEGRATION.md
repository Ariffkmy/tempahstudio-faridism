# Baileys WhatsApp Integration Guide

## Overview
This directory contains the Baileys WhatsApp Web library, integrated as a copied module for the WhatsApp Blaster feature in RayaStudio.

**Version**: 7.0.0-rc.9  
**Source**: https://github.com/WhiskeySockets/Baileys  
**Integration Date**: 2025-12-21

## Why Copied Module?
Baileys is integrated as a copied module (not npm package) to allow:
- ✅ Custom modifications to core functionality
- ✅ Full control over updates
- ✅ Ability to customize without forking
- ✅ Independent version control

## Directory Structure
```
src/baileys/
├── index.ts              # Main entry point
├── package.json          # Baileys dependencies
├── tsconfig.json         # TypeScript configuration
├── README.md             # Original Baileys documentation
├── INTEGRATION.md        # This file
├── Defaults/             # Default configurations
├── Socket/               # WebSocket connection handlers
├── Store/                # State management
├── Types/                # TypeScript type definitions
├── Utils/                # Utility functions
└── WABinary/             # WhatsApp binary protocol handlers
```

## Installed Dependencies
The following Baileys dependencies have been installed in the main project:

### Core Dependencies
- `@cacheable/node-cache@^1.4.0` - Caching layer
- `@hapi/boom@^9.1.3` - HTTP error handling
- `async-mutex@^0.5.0` - Async synchronization
- `libsignal` - Signal protocol implementation (from GitHub)
- `lru-cache@^11.1.0` - LRU cache implementation
- `music-metadata@^11.7.0` - Audio metadata extraction
- `p-queue@^9.0.0` - Promise queue
- `pino@^9.6` - Logging
- `protobufjs@^7.2.4` - Protocol buffers
- `ws@^8.13.0` - WebSocket client

### Optional Peer Dependencies
These can be installed if needed:
- `audio-decode@^2.1.3` - Audio decoding
- `jimp@^1.6.0` - Image processing
- `link-preview-js@^3.0.0` - Link preview generation
- `sharp` - High-performance image processing

## Usage in Your Project

### Basic Import
```typescript
import makeWASocket from './baileys';
import { useMultiFileAuthState } from './baileys/Store';
```

### Example: Creating a WhatsApp Connection
```typescript
import makeWASocket, { DisconnectReason } from './baileys';
import { useMultiFileAuthState } from './baileys/Store';
import { Boom } from '@hapi/boom';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if(shouldReconnect) {
        connectToWhatsApp();
      }
    } else if(connection === 'open') {
      console.log('opened connection');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  return sock;
}
```

### Example: Sending a Message
```typescript
const sock = await connectToWhatsApp();

// Send text message
await sock.sendMessage('1234567890@s.whatsapp.net', { 
  text: 'Hello from RayaStudio!' 
});

// Send message with image
await sock.sendMessage('1234567890@s.whatsapp.net', {
  image: { url: './image.jpg' },
  caption: 'Check this out!'
});
```

## Updating Baileys

When you need to update to a newer version of Baileys:

### Method 1: Manual Update (Recommended)
```bash
# 1. Clone the latest Baileys to a temporary location
git clone https://github.com/WhiskeySockets/Baileys.git temp_baileys_update

# 2. Backup your customizations
cp -r src/baileys src/baileys_backup

# 3. Copy new source files
xcopy /E /I /Y temp_baileys_update\src src\baileys

# 4. Copy updated config files
copy temp_baileys_update\package.json src\baileys\package.json
copy temp_baileys_update\tsconfig.json src\baileys\tsconfig.json

# 5. Review and merge your customizations from backup

# 6. Update dependencies if package.json changed
npm install

# 7. Clean up
rmdir /S /Q temp_baileys_update
```

### Method 2: Git Diff Approach
```bash
# 1. Add Baileys as a remote
cd src/baileys
git init
git remote add upstream https://github.com/WhiskeySockets/Baileys.git

# 2. Fetch updates
git fetch upstream

# 3. Review changes
git diff HEAD upstream/master

# 4. Merge or cherry-pick changes as needed
```

## Customization Guidelines

### Where to Make Changes
- **Custom utilities**: Add to `src/baileys/Utils/custom/`
- **Custom handlers**: Add to `src/baileys/Socket/custom/`
- **Configuration overrides**: Modify `src/baileys/Defaults/`

### Tracking Your Changes
Create a `CUSTOMIZATIONS.md` file to document:
- What files you've modified
- Why you made the changes
- Date of modification

This will help when merging updates from upstream.

## TypeScript Configuration

The Baileys module has its own `tsconfig.json`. If you encounter type errors, you may need to:

1. Update your main `tsconfig.json` to include the baileys directory
2. Add path mappings if needed:
```json
{
  "compilerOptions": {
    "paths": {
      "@baileys/*": ["./src/baileys/*"]
    }
  }
}
```

## Troubleshooting

### Build Errors
If you encounter build errors:
```bash
# Rebuild Baileys
cd src/baileys
npm run build
```

### Missing Dependencies
If you get dependency errors:
```bash
# Install all Baileys dependencies
npm install @cacheable/node-cache @hapi/boom async-mutex lru-cache music-metadata p-queue pino protobufjs ws
npm install git+https://github.com/whiskeysockets/libsignal-node
```

### Type Errors
Ensure your main `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Resources

- **Official Documentation**: https://github.com/WhiskeySockets/Baileys
- **Examples**: See `temp_baileys/Example/` (if you kept the temp folder)
- **API Reference**: Check the original README.md in this directory

## Notes

- This is a **copied module**, not a git submodule or npm package
- Keep track of your customizations for easier updates
- Test thoroughly after updating Baileys
- Consider creating integration tests for your WhatsApp features

## Support

For Baileys-specific issues, refer to:
- GitHub Issues: https://github.com/WhiskeySockets/Baileys/issues
- Discussions: https://github.com/WhiskeySockets/Baileys/discussions

For RayaStudio integration issues, document them in your project's issue tracker.
