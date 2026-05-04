# Afternote FHE

Afternote FHE is a privacy-preserving deadman switch for encrypted notes, credentials, and recovery material.

The idea is simple: a user encrypts sensitive data ahead of time, keeps the vault active by checking in, and lets the protocol release access to chosen recipients only if the unlock condition is met.

## Current Implementation Status

The MVP is now functional with core features deployed and integrated:

**Smart Contract (Solidity on Fhenix)**

- Vault creation with encrypted AES key and IV protection using FHE
- Multi-beneficiary support (up to 3 per vault)
- Heartbeat mechanism (`ping`) to prove owner activity
- Automatic unlock after inactivity threshold (10 days)
- Vault updates (content, beneficiaries, encryption keys)
- Event-based state tracking

**Frontend Client (React + Vite)**

- Landing page with onboarding flow and Web3 wallet integration
- Vaults list view with all user vaults
- Vault creation page with beneficiary selection
- Vault details page with metadata, timeline, and actions
- Ping action to reset inactivity timer
- Update vault functionality
- Decrypt action for released vaults
- Reown AppKit integration for wallet connectivity
- Ant Design component library for polished UI

**Tech Stack**

- Contract: Solidity 0.8.34 with FHE primitives (CoFHE SDK from Fhenix)
- Frontend: React 19, Vite, TanStack Router, Ant Design
- Cryptography: Client-side AES-128 encryption, FHE-based access control
- Web3: ethers.js v6, Reown AppKit for wallet management

## Why This Matters

**Problem:** Important data (wallet recovery, credentials, personal instructions) gets lost or stuck behind a single key. Existing inheritance flows rely on lawyers, custodians, or blind trust.

**Solution:** A decentralized dead letter service that ensures _the right people know the right things if you ever cannot tell them yourself_.

**Core Features:**

- Client-side AES-128 encryption of vault content
- FHE-protected encryption keys stored in smart contract
- Heartbeat-based inactivity tracking
- Automatic beneficiary access grant on unlock
- No plaintext stored on-chain; hybrid private/on-chain model

**Use Cases:** Recovery instructions for family, operational secrets for teams, wallet recovery material, private messages with conditions

## High-Level Flow

```mermaid
flowchart TD
    A[Owner creates vault]
    B[Client encrypts note content]
    C[FHE protects AES key in contract]
    D[Owner pings to stay active]
    E{Inactivity threshold passed?}
    F[Contract unlocks and grants beneficiary access]
    G[Beneficiary decrypts vault]

    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Yes, after 10 days| F
    E -->|No| D
    F --> G
```

## Getting Started

### Deploying Contract (Optional)

This project is scaffolded using [hardhat](https://hardhat.org/docs). Please refer to the documentation for more information on folder structure and configuration.

```bash

npm install

npx hardhat keystore set PRIVATE_KEY

npx hardhat compile

npx hardhat ignition deploy ignition/modules/Afternote.ts --network sepolia

# run end-to-end tests
npx hardhat run --network sepolia scripts/e2e.ts
```

### Running Client

```bash
cd client

npm install'

npm run dev
```

## Why FHE

Plain encryption isn't enough—we need to enforce _who_ decrypts and _when_. FHE lets the contract manage encrypted values and access rules without exposing secrets during execution, making release conditions programmable and trustless.

## Implementation Architecture

### 1. Client Layer (React Application)

The frontend handles user interactions and cryptographic operations before data reaches the blockchain:

- Encrypts notes with AES-128 on the client before upload
- Prepares encrypted key/IV using Fhenix SDK for FHE contract input
- Manages wallet connection via Reown AppKit
- Displays vault status with countdown timers and unlock eligibility
- Enables vault updates and ping actions
- Decrypts vaults after recovery using the FHE-decrypted key material

Current pages:

- Landing page: Onboarding and wallet connection
- Vaults list: Overview of all vaults with status indicators
- Create vault: Form to add beneficiaries and encrypt content
- Vault details: View status, take actions (ping/update/decrypt), see timeline

### 2. Smart Contract Layer (Fhenix Blockchain)

The contract enforces access rules and manages encrypted state:

```solidity
struct Vault {
    euint128 encryptedKey;        // FHE-protected AES key
    euint128 encryptedIv;         // FHE-protected initialization vector
    bytes ciphertext;              // Encrypted vault content (stored on-chain for MVP)
    address[] beneficiaries;       // Recipients who can decrypt on release
    uint64 lastActiveAt;           // Timestamp of last ping
    bool isReleased;               // Release state flag
}
```

Contract functions:

- `addVault()`: Create new vault with encrypted key/IV and beneficiary list
- `updateVault()`: Modify content, key, or beneficiaries (before release)
- `ping()`: Update `lastActiveAt` to prove owner activity
- `release()`: Grant beneficiary access after inactivity threshold
- `getVaults()`: Retrieve all vaults for owner
- `getVaultById()`: Retrieve specific vault details

Key constraints:

- Max 3 beneficiaries per vault (configurable)
- 10-day inactivity threshold for release (configurable)
- Beneficiary access granted only at unlock time, not before
- Once released, vaults cannot be modified

### 3. Cryptography Model

Hybrid encryption for efficiency and privacy:

- **Client-side**: AES-128 encrypts the full vault content
- **On-chain**: FHE protects the AES key and IV
- **Access control**: FHE primitives prevent decryption until release conditions are met
- **Data**: Encrypted ciphertext stored on-chain in MVP; can move to IPFS/storage layer later

### 4. Optional Backend Services (Planned)

Not yet implemented, but designed for:

- Email notifications for ping reminders before deadline
- Release notifications to beneficiaries
- Automated unlock triggers via oracle or Upkeep
- Event listeners for tracking vault state changes

## MVP scope

The Milestone 1 MVP includes:

- Support for 3 to 5 notes per user
- Up to 3 beneficiaries per note (configurable in contract)
- Encrypted note ciphertext stored on-chain (MVP approach)
- Heartbeat-based inactivity tracking (10-day threshold)
- Add and remove beneficiaries before unlock
- Owner access preserved throughout
- Beneficiary access granted only after unlock
- Full-featured React client with wallet integration
- Functional smart contract on Fhenix testnet
- AES-128 encryption on client with FHE-protected keys

## Where the project can grow

See the [Roadmap](#roadmap) section below for detailed feature expansion plans. In summary, the platform will evolve to support:

- Smart vault filtering and status indicators
- Dedicated beneficiary experience with clearer recovery flows
- Oracle-assisted automatic unlock
- Email notifications and reminders
- Richer media support (images, documents, audio, video)
- Time-based unlock options
- Editing and archiving capabilities
- Scale beyond current MVP limitations

## Roadmap

### Milestone 1: Basic MVP (COMPLETED)

Delivered features:

- Basic encrypted note vault with smart contract
- 3 to 5 notes per user
- Up to 3 beneficiaries per note
- Encrypted ciphertext stored on-chain
- Heartbeat-based inactivity tracking (10 days)
- Add and remove beneficiaries before unlock
- Owner access preserved throughout
- Beneficiary access granted only after unlock
- Functional React UI with wallet integration

Exit criteria met:

- One user can create notes, stay active with `ping()`, and let a beneficiary recover a note after the unlock condition is met.

### Milestone 2: Smart Filtering, Beneficiary UX, and Auto Unlock (IN PROGRESS)

Planned additions:

- Vault status filtering on client:
  - Active: Recently pinged
  - Warning: Approaching inactivity threshold
  - Overdue: Past threshold, eligible for unlock
  - Released: Already unlocked
  - Personal: Vaults I own
  - Received: Vaults shared with me as beneficiary
- Dedicated beneficiary decrypt page with:
  - Vault origin and owner information
  - Unlock timeline and countdown
  - Decryption interface
  - Clear explanation of why they received it
- Permissionless release (anyone can trigger unlock after threshold)
- Oracle/Upkeep integration for automated release
- Email notifications:
  - Ping reminders before deadline
  - Release notifications to beneficiaries

### Milestone 3: Content Management and Rich Media Support

Planned features:

- Edit notes before unlock
- Delete/archive vaults safely
- Support for richer media (images, documents, videos, audio)
- Time-based unlock options (in addition to inactivity-based)
- Improved recovery UX for beneficiaries

Exit criteria:
The product feels usable for real personal and team scenarios, not only for plain-text notes.

### Milestone 4: Product Hardening

- Comprehensive test coverage for contract and client
- Edge-case handling around unlock and recovery
- Storage layer optimization (move to IPFS for scalability)
- Event handling and operational reliability improvements

Exit criteria:
Core feature set is stable enough for broader demos and external testing.

### Milestone 5: Scale and Expand

- Remove MVP limitations (beneficiary count, vault limits)
- Advanced recovery flows
- Team management and delegation
- Production-ready deployment configuration
- Security audit and certification

## License

MIT
