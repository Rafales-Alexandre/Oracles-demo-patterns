import axios from 'axios';
import { ethers } from 'ethers';

// Configuration for local network
const provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const wallet: ethers.Wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
const contractAddress: string = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Oracle contract ABI
const abi: ethers.InterfaceAbi = [
  "function updateData(uint256 value) external",
  "function getData() external view returns (uint256 value, uint256 timestamp)",
  "event DataUpdated(uint256 indexed value, uint256 timestamp)"
];

const contract: ethers.Contract = new ethers.Contract(contractAddress, abi, wallet);

// Mock API for testing - replace with your real API
const API_URL: string = 'https://api.example.com/data';

async function updateOracle(): Promise<void> {
  try {
    console.log('Updating oracle...');
    
    // For testing, use a random value instead of calling a real API
    // const response = await axios.get(API_URL);
    // const value: number = response.data.value;
    
    // Mock value for testing
    const value: number = Math.floor(Math.random() * 1000);
    
    const tx: ethers.ContractTransactionResponse = await contract.updateData(value);
    await tx.wait();
    console.log(`Data updated with value: ${value}`);
  } catch (error: unknown) {
    console.error('Error during update:', error);
  }
}

// Launch first update immediately
updateOracle();

// Then update every 5 minutes
setInterval(updateOracle, 5 * 60 * 1000);

console.log('Updater started. Updating every 5 minutes...');