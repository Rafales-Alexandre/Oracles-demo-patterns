# Oracle Demo Patterns

A blockchain oracle demonstration project with Hardhat, TypeScript and Ignition.

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Start and Test the Updater

#### Step 1: Start the local node
```bash
npm run node
```

#### Step 2: Deploy the Oracle contract
```bash
npm run deploy:local
```

#### Step 3: Launch the Updater
```bash
npm run updater
```

The Updater will:
- ✅ Connect to localhost network
- ✅ Update the oracle every 5 minutes
- ✅ Display logs in English
- ✅ Use random values for testing

**Expected output:**
```
Updating oracle...
Updater started. Updating every 5 minutes...
Data updated with value: 847
```

### 3. Test the Oracle

#### Simple test
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

#### Complete test
```bash
npm run test:oracle
```

## 📁 Project Structure

```
Oracles-demo-patterns/
├── contracts/
│   └── Oracle.sol          # Main Oracle contract
├── scripts/
│   ├── Updater.ts          # Automatic update script
│   ├── testOracle.ts       # Complete Oracle tests
│   ├── simpleTest.ts       # Simple verification test
│   └── deploy.ts           # Manual deployment script
├── test/
│   ├── Oracle.test.ts      # Unit tests
│   └── OracleIntegration.test.ts
├── ignition/
│   └── modules/
│       └── DeployOracle.ts # Ignition deployment module
└── hardhat.config.ts       # Hardhat configuration
```

## 🔧 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run node` | Starts a local Hardhat node |
| `npm run deploy:local` | Deploys Oracle to localhost |
| `npm run updater` | Launches automatic updater |
| `npm run test:oracle` | Complete Oracle tests |
| `npm run test` | Unit tests |
| `npm run compile` | Compiles contracts |
| `npm run clean` | Cleans build artifacts |

## 📋 Features

### Oracle Contract (`contracts/Oracle.sol`)
- ✅ **Access Control**: Only oracleUpdater can update data
- ✅ **Events**: `DataUpdated` for tracking updates
- ✅ **Public Functions**: `getData()` to read data
- ✅ **Timestamp**: Automatic update timestamp recording

### Updater Script (`scripts/Updater.ts`)
- ✅ **Automatic Connection** to localhost network
- ✅ **Periodic Updates** every 5 minutes
- ✅ **Error Handling** with try/catch
- ✅ **English Logs** for clear monitoring
- ✅ **Test Values** with random data

### Tests
- ✅ **Complete Unit Tests**
- ✅ **Integration Tests**
- ✅ **Security Tests** (unauthorized access)
- ✅ **Performance Tests**

## 🛠️ Advanced Configuration

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

## 🔍 Troubleshooting

### "could not decode result data" Error
- ✅ Check that Hardhat node is running: `npm run node`
- ✅ Redeploy the contract: `npm run deploy:local`

### Network Connection Error
- ✅ Verify local node is accessible on `http://127.0.0.1:8545`
- ✅ Restart the node if necessary

### Deployment Error
- ✅ Clean cache: `npm run clean`
- ✅ Delete `ignition/deployments/chain-1337` folder
- ✅ Redeploy: `npm run deploy:local`

## 📊 Monitoring

### Check Oracle Status
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

### Track Updates
Updater logs display:
- Timestamp of each update
- Updated value
- Any errors

## 🎯 Next Steps

1. **Customize API**: Replace mock API with your real data source
2. **Add Metrics**: Integrate monitoring tools
3. **Deploy to Production**: Configure for public network
4. **Add Tests**: Extend test coverage

---

**Note**: This project is designed for learning and demonstration. For production use, ensure appropriate security measures are implemented.