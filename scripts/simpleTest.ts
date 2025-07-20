import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Simple Oracle test...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Signer:", deployer.address);

  // Contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Check if address has code
  const code = await ethers.provider.getCode(contractAddress);
  console.log("📋 Code at address:", code);
  
  if (code === "0x") {
    console.log("❌ No contract deployed at this address");
    return;
  }
  
  console.log("✅ Contract found at this address");
  
  // Simple ABI
  const abi = [
    "function getData() external view returns (uint256 value, uint256 timestamp)"
  ];
  
  try {
    const oracle = new ethers.Contract(contractAddress, abi, deployer);
    const result = await oracle.getData();
    console.log("✅ getData() works:", result);
  } catch (error) {
    console.log("❌ Error with getData():", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 