# Oracle Demo Patterns

This repository demonstrates a simple blockchain oracle mechanism using Solidity smart contracts and an off-chain TypeScript script for automatic updates. It allows maintaining up-to-date data on the blockchain with a periodic update system. The setup uses Hardhat for local development and testing.

> **⚠️ This is a pedagogical example — not production-ready. Always audit code before any real use.**

---

## How the Oracle Works

1. **Smart Contract Oracle** : Stores data and timestamps with access control.
2. **Updater Script** : Connects periodically to update the data.
3. **Event System** : Emits events to track updates.
4. **Public Interface** : Allows querying current data.

---

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Basic knowledge of Solidity, TypeScript, and Ethereum development

---

## Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd Oracles-demo-patterns
```

Install dependencies:

```bash
npm install
```

This includes Hardhat, Ethers.js, Axios, TypeScript, and testing libraries.

Compile the Solidity contracts:

```bash
npx hardhat compile
```

---

## Project Structure

```
contracts/           # Solidity files
  └─ Oracle.sol            # Main Oracle contract
scripts/            # TypeScript scripts
  ├─ Updater.ts           # Automatic update script
  ├─ simpleTest.ts        # Simple Oracle test
  ├─ testOracle.ts        # Complete Oracle tests
  └─ liveOracle.ts        # Live Oracle test
test/               # TypeScript unit tests
  ├─ Oracle.test.ts       # Contract interaction tests
  └─ OracleIntegration.test.ts
ignition/           # Ignition deployment modules
  └─ modules/
      └─ DeployOracle.ts  # Ignition deployment module
hardhat.config.ts   # Hardhat configuration
```

---

## Code Explanation

### Oracle.sol (Main Contract)

This contract manages data storage and updates with access control. Only the oracleUpdater can modify the data.

```solidity
contract Oracle {
    uint256 private data;
    uint256 private lastUpdated;
    address public oracleUpdater;
    
    event DataUpdated(uint256 indexed value, uint256 timestamp);
    
    constructor() {
        oracleUpdater = msg.sender;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracleUpdater, "Not authorized");
        _;
    }
    
    function updateData(uint256 value) external onlyOracle {
        data = value;
        lastUpdated = block.timestamp;
        emit DataUpdated(value, block.timestamp);
    }
    
    function getData() external view returns (uint256 value, uint256 timestamp) {
        return (data, lastUpdated);
    }
}
```

- **updateData** : Updates the data and timestamp, emits `DataUpdated`.
- **getData** : Returns current data and timestamp of last update.
- **onlyOracle** : Modifier that restricts access to oracleUpdater.

### Updater Script (Updater.ts)

The update script connects periodically to the oracle and updates the data with new values.

```typescript
async function updateOracle(): Promise<void> {
  try {
    console.log('Updating oracle...');
    
    // For testing, use a random value
    const value: number = Math.floor(Math.random() * 1000);
    
    const tx: ethers.ContractTransactionResponse = await contract.updateData(value);
    await tx.wait();
    console.log(`Data updated with value: ${value}`);
  } catch (error: unknown) {
    console.error('Error during update:', error);
  }
}

// Immediate update then every 5 minutes
updateOracle();
setInterval(updateOracle, 5 * 60 * 1000);
```

- Connects to localhost network
- Updates oracle every 5 minutes
- Uses random values for testing
- Handles errors with try/catch

> **Note** : For production, replace the random value with a real API call.

---

## Step-by-Step Usage

### 1. Start the Local Hardhat Node

```bash
npm run node
```

This starts a JSON-RPC server at http://127.0.0.1:8545 with predefined test accounts.

> **Tip** : Restart the node if you encounter nonce or state issues (Ctrl+C then relaunch).

### 2. Deploy the Oracle Contract

In a new terminal:

```bash
npm run deploy:local
```

This deploys the Oracle contract to localhost using Hardhat Ignition.
The deployment address will be automatically saved in `ignition/deployments/chain-1337/deployed_addresses.json`.
Update this address in `scripts/Updater.ts` if needed.

- **Deployer** : Hardhat account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Oracle Updater** : Same account as deployer

### 3. Launch the Update Script

The update script listens and automatically updates the oracle:

```bash
npm run updater
```

It uses account #0's private key as oracleUpdater (authorized in the contract).

### 4. Test the Oracle

#### Simple Test
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

#### Complete Tests
```bash
npm run test:oracle
```

#### Unit Tests
```bash
npm run test
```

### 5. Verify Updates

The update script displays:
- Timestamp of each update
- Updated value
- Any errors

**Expected output:**
```
Updating oracle...
Updater started. Updating every 5 minutes...
Data updated with value: 847
```

> **If errors occur** (connection issues, nonce, etc.):
> - Ensure the oracleUpdater key matches the authorized one.
> - Restart the node and redeploy if the state is corrupted.

---

## Advanced Configuration

### Modify Update Interval

In `scripts/Updater.ts`, line 46:
```typescript
setInterval(updateOracle, 5 * 60 * 1000); // 5 minutes
```

### Use a Real API

In `scripts/Updater.ts`, replace lines 25-28:
```typescript
// Replace with your real API
const response = await axios.get('https://your-api.com/data');
const value: number = response.data.value;
```

### Deploy to Another Network

1. Modify `hardhat.config.ts` to add your network
2. Use `npm run deploy` instead of `npm run deploy:local`

---

## Security & Limitations

- **Simplified demo** : Add multisig, pause, audits, rate limits for production.
- **Centralized updater** : For production, consider Chainlink, zk-proofs, etc.
- **Never use real funds or unaudited code!**

---

## Troubleshooting

- **Nonce Errors** : Restart the Hardhat node and redeploy.
- **Connection Errors** : Verify local node is accessible on `http://127.0.0.1:8545`.
- **Deployment Errors** : Clean cache with `npm run clean`.
- **"Not authorized"** : Check the oracleUpdater key.

---

## Available Scripts

| Command | Description |
|----------|-------------|
| `npm run node` | Starts a local Hardhat node |
| `npm run deploy:local` | Deploys Oracle to localhost |
| `npm run updater` | Launches automatic updater |
| `npm run test:oracle` | Complete Oracle tests |
| `npm run test` | Unit tests |
| `npm run compile` | Compiles contracts |
| `npm run clean` | Cleans build artifacts |

---

## Monitoring

### Check Oracle Status
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

### Track Updates
The update script logs display:
- Timestamp of each update
- Updated value
- Any errors

---

## Next Steps

1. **Customize API** : Replace mock API with your real data source
2. **Add Metrics** : Integrate monitoring tools
3. **Deploy to Production** : Configure for public network
4. **Add Tests** : Extend test coverage

---

## Acknowledgements

Inspired by blockchain oracle concepts — contributions welcome! If this project helps you, please star the repo ⭐.
