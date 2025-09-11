# 🌳 Urbanivore - NOSTR-Enabled Urban Foraging Platform

> **Work in Progress** - A decentralized application for discovering and sharing urban edible trees and recipes via the NOSTR protocol.

## 🎯 Overview

Urbanivore is a Web3 application that enables users to discover, document, and share urban edible trees and recipes through the decentralized NOSTR protocol. Built with modern web technologies and integrated with the UPlanet ecosystem, it provides a sovereign platform for urban foraging communities.

## 🌐 Web3 Architecture

This project is built on the **Web3 3x1/3 architecture** model, which provides a balanced approach to decentralized applications:

- **1/3 Client-side**: Rich user interface with local data processing
- **1/3 Server-side**: API services and data validation
- **1/3 Blockchain/Protocol**: NOSTR protocol for decentralized messaging and IPFS for content storage

For more details on this architecture, see: [Paiement en ligne côté serveur - Forum Duniter](https://forum.duniter.org/t/paiement-en-ligne-cote-serveur/13246/2)

## 🚀 Features

### Core Functionality
- **🌳 Tree Discovery**: Document edible trees with species, location, and accessibility
- **🍳 Recipe Sharing**: Share recipes using urban foraged ingredients
- **📍 Geolocation**: Interactive maps with Leaflet.js for precise location tracking
- **📸 Media Support**: Photo uploads with IPFS storage via uSPOT API

### NOSTR Integration
- **🔐 NOSTR Authentication**: Connect with NOSTR browser extensions (Alby, nos2x, etc.)
- **📡 Decentralized Messaging**: Share discoveries via NOSTR relays
- **🏷️ Rich Metadata**: NIP-101 geographical tags and custom event types
- **🔄 Real-time Updates**: Live message synchronization across relays

### uSPOT & UPlanet Ecosystem
- **📁 IPFS Storage**: Automatic file uploads to user's uDRIVE
- **🔗 uSPOT API**: Integration with local UPlanet API for file management
- **💰 G1/ZEN Economy**: Display wallet balances from the Ğ1 cryptocurrency
- **🌍 Decentralized Identity**: Sovereign identity management via NOSTR

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Vanilla JS with modern features
- **Leaflet.js**: Interactive mapping
- **NostrTools**: NOSTR protocol implementation

### Backend Integration
- **uSPOT API**: Local UPlanet API for file operations
- **NOSTR Relays**: Decentralized messaging infrastructure
- **IPFS**: Distributed content storage

### Infrastructure
- **Astroport.ONE**: Complete infrastructure stack including:
  - NOSTR relay server
  - IPFS gateway
  - uSPOT API server
  - Ğ1 cryptocurrency integration

## 📦 Installation & Setup

### Prerequisites

1. **Install Astroport.ONE** (Required for uSPOT API and NOSTR relay):
   ```bash
   bash <(curl -sL https://install.astroport.com)
   ```
   
   This installs the complete UPlanet ecosystem including:
   - NOSTR relay server
   - IPFS gateway
   - uSPOT API (54321.py)
   - Ğ1 cryptocurrency integration

   For more information, visit: [Astroport.ONE GitHub Repository](https://github.com/papiche/Astroport.ONE)

2. **Add your Captain Account**: Create 1st MULTIPASS + ZEN Card

   ```bash
   ## Run Captain Interface
   ~/.zen/Astroport.ONE/captain.sh

   ## Run Astroport Interface
   ~/.zen/Astroport.ONE/command.sh
   ```

3. Open UPlanet App : http://127.0.0.1:8080/ipns/copylaradio.com

4. Register new MULTIPASS : http://127.0.0.1:54321/g1

### Ugrade Urbanivore ipfs CID

```
## from source de directory, run
    ipfs add -rw * 

## try resulting CID : http://127.0.0.1:8080/ipfs/$CID
```

## 🔧 Configuration

### uSPOT API Configuration

The application automatically detects the uSPOT API URL based on your current IPFS gateway:

- **Local Development**: `http://127.0.0.1:54321`
- **IPFS Gateway**: Automatically transforms `ipfs.` to `u.` and port `8080` to `54321`

### NOSTR Relays

Default relay configuration:
```javascript
const DEFAULT_RELAYS = [
    'wss://relay.copylaradio.com', // UPlanet ORIGIN relay
    'ws://127.0.0.1:7777',  // Local relay (via Astroport.ONE)
    'wss://relay.damus.io',
    'wss://nos.lol'
];
```

## 📱 Usage

### Connecting to NOSTR

1. **Install NOSTR Extension**: Ensure you have a NOSTR browser extension installed
2. **Connect**: Click "🔗 Se connecter avec NOSTR" in the interface
3. **Authorize**: Approve the connection in your NOSTR extension
4. **Verify**: The interface will test your NOSTR authentication with the uSPOT API

### Adding Tree Discoveries

1. **Select Form**: Choose "🌳 Nouvel arbre" from the form toggle
2. **Fill Details**:
   - Species name (required)
   - Description
   - Harvest season
   - Accessibility (public/private)
   - Photo (optional)
3. **Set Location**: Use GPS or manual coordinates
4. **Publish**: Click "📤 Publier sur NOSTR"

### Sharing Recipes

1. **Select Form**: Choose "🍳 Nouvelle recette" from the form toggle
2. **Fill Details**:
   - Recipe title (required)
   - Ingredients (required)
   - Instructions (required)
   - Difficulty level
   - Preparation time
   - Photo (optional)
3. **Set Location**: Where the recipe was created/tested
4. **Publish**: Click "📤 Publier sur NOSTR"

### File Uploads

Images are automatically uploaded to your uDRIVE via the uSPOT API:
- **NIP-42 Authentication**: Secure uploads with your NOSTR identity
- **IPFS Storage**: Files stored on IPFS with CID tracking
- **Automatic Integration**: Images appear in your NOSTR messages

## 🔐 Security & Privacy

### NOSTR Authentication
- **NIP-42**: Secure authentication via NOSTR events
- **Private Keys**: Never transmitted, handled by browser extensions
- **Relay Verification**: Automatic verification of authentication events

### Data Sovereignty
- **Local Storage**: User data stored in their uDRIVE
- **IPFS Content**: Immutable, censorship-resistant storage
- **Decentralized Identity**: No central authority required

## 🌍 UPlanet Ecosystem Integration

Urbanivore is designed to work seamlessly with the UPlanet ecosystem:

### uSPOT API Endpoints Used
- `/api/upload`: File uploads with NIP-42 authentication
- `/api/test-nostr`: NOSTR authentication verification
- `/check_balance`: G1/ZEN wallet balance checking
- `/g1nostr`: NOSTR account creation

### Economic Integration
- **G1 Balance**: Display Ğ1 cryptocurrency balances
- **ZEN Calculation**: Automatic ZEN calculation based on G1 balance
- **Cooperative Model**: Integration with CopyLaRadio SCIC cooperative

## 🚧 Development Status

### ✅ Completed Features
- [x] NOSTR extension detection and connection
- [x] Tree discovery form and publishing
- [x] Recipe sharing form and publishing
- [x] Interactive map with Leaflet.js
- [x] uSPOT API integration
- [x] File upload to IPFS via uSPOT
- [x] G1/ZEN balance display
- [x] NOSTR authentication testing
- [x] Real-time message synchronization
- [x] Responsive design

### 🔄 In Progress
- [ ] Enhanced NOSTR event filtering
- [ ] Advanced search and discovery features
- [ ] Community features and moderation
- [ ] Mobile app development
- [ ] Integration with additional NOSTR clients

### 📋 Planned Features
- [ ] Offline support with service workers
- [ ] Advanced mapping features (routing, clustering)
- [ ] Recipe rating and review system
- [ ] Seasonal harvest notifications
- [ ] Integration with local food banks
- [ ] Educational content and guides

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly** with NOSTR extension and uSPOT API
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Testing

- **NOSTR Integration**: Test with multiple NOSTR extensions
- **uSPOT API**: Verify file uploads and authentication
- **IPFS**: Ensure content is properly stored and accessible
- **Responsive Design**: Test on various screen sizes

## 🙏 Acknowledgments

- **Astroport.ONE Team**: For the comprehensive UPlanet ecosystem
- **NOSTR Community**: For the decentralized messaging protocol
- **Ğ1 Community**: For the free currency and economic model
- **CopyLaRadio Cooperative**: For the cooperative infrastructure

## 🔗 Links

- **Project Repository**: [GitHub Repository]
- **Astroport.ONE**: [https://github.com/papiche/Astroport.ONE](https://github.com/papiche/Astroport.ONE)
- **NOSTR Protocol**: [https://github.com/nostr-protocol/nostr](https://github.com/nostr-protocol/nostr)
- **Ğ1 Currency**: [https://monnaie-libre.fr](https://monnaie-libre.fr)
- **UPlanet ORIGIN**: [https://qo-op.com](https://qo-op.com)

---

**🌳 Happy foraging! Share your urban discoveries with the world via NOSTR! 🌳**
