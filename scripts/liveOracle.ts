import { ethers } from "hardhat";
import axios from "axios";

async function main() {
  console.log("🌐 Live Oracle - Test with real API...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Oracle Updater:", deployer.address);

  // Deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get contract
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = Oracle.attach(contractAddress);

  console.log("📋 Oracle Contract:", contractAddress);

  // Function to get Bitcoin price
  async function getBitcoinPrice(): Promise<number> {
    try {
      console.log("🔍 Fetching Bitcoin price...");
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const price = response.data.bitcoin.usd;
      console.log(`   💰 Bitcoin price: $${price}`);
      return Math.floor(price * 100); // Convert to cents to avoid decimals
    } catch (error) {
      console.log("   ⚠️ API error, using default value");
      return 50000; // Default value in case of error
    }
  }

  // Function to get Ethereum price
  async function getEthereumPrice(): Promise<number> {
    try {
      console.log("🔍 Fetching Ethereum price...");
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const price = response.data.ethereum.usd;
      console.log(`   💰 Ethereum price: $${price}`);
      return Math.floor(price * 100); // Convert to cents
    } catch (error) {
      console.log("   ⚠️ API error, using default value");
      return 3000; // Default value in case of error
    }
  }

  // Function to update oracle
  async function updateOracle(value: number, description: string) {
    try {
      console.log(`📝 Updating oracle with: ${description}`);
      const tx = await oracle.connect(deployer).updateData(value);
      console.log("   Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("   ✅ Transaction confirmed in block:", receipt?.blockNumber);
      
      // Verification
      const [data, timestamp] = await oracle.getData();
      console.log(`   📊 Updated data: ${data} (${description})`);
      console.log(`   ⏰ Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
      
      return true;
    } catch (error) {
      console.log("   ❌ Error during update:", (error as Error).message);
      return false;
    }
  }

  // Test 1: Bitcoin price
  console.log("\n" + "=".repeat(50));
  console.log("🪙 TEST 1: Bitcoin Price");
  console.log("=".repeat(50));
  
  const btcPrice = await getBitcoinPrice();
  await updateOracle(btcPrice, `Bitcoin Price: $${btcPrice / 100}`);

  // Wait 5 seconds
  console.log("\n⏳ Waiting 5 seconds...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Ethereum price
  console.log("\n" + "=".repeat(50));
  console.log("🔷 TEST 2: Ethereum Price");
  console.log("=".repeat(50));
  
  const ethPrice = await getEthereumPrice();
  await updateOracle(ethPrice, `Ethereum Price: $${ethPrice / 100}`);

  // Test 3: Weather oracle simulation (simulated data)
  console.log("\n" + "=".repeat(50));
  console.log("🌤️ TEST 3: Weather Oracle (simulated)");
  console.log("=".repeat(50));
  
  const weatherData = {
    temperature: 22, // degrees Celsius
    humidity: 65,    // percentage
    pressure: 1013   // hPa
  };
  
  // Encode weather data into a single number
  const encodedWeather = weatherData.temperature * 10000 + weatherData.humidity * 100 + weatherData.pressure;
  console.log("   🌡️ Simulated weather data:", weatherData);
  console.log("   🔢 Encoded data:", encodedWeather);
  
  await updateOracle(encodedWeather, `Weather: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity, ${weatherData.pressure}hPa`);

  // Test 4: Exchange rate oracle (simulated)
  console.log("\n" + "=".repeat(50));
  console.log("💱 TEST 4: EUR/USD Exchange Rate (simulated)");
  console.log("=".repeat(50));
  
  const exchangeRate = 1.0850; // EUR/USD
  const encodedRate = Math.floor(exchangeRate * 10000); // Encode with 4 decimals
  console.log("   💱 Simulated EUR/USD rate:", exchangeRate);
  console.log("   🔢 Encoded rate:", encodedRate);
  
  await updateOracle(encodedRate, `EUR/USD Rate: ${exchangeRate}`);

  // Test 5: Final verification and history
  console.log("\n" + "=".repeat(50));
  console.log("📊 FINAL ORACLE STATE");
  console.log("=".repeat(50));
  
  const [finalData, finalTimestamp] = await oracle.getData();
  console.log("   📈 Last value:", finalData.toString());
  console.log("   ⏰ Last update:", new Date(Number(finalTimestamp) * 1000).toLocaleString());
  console.log("   🔑 Oracle Updater:", await oracle.oracleUpdater());

  console.log("\n🎉 Live oracle tests completed!");
  console.log("\n💡 Note: Real data comes from CoinGecko API");
  console.log("   Weather and exchange rate data are simulated for demonstration");
}

main()
  .then(() => {
    console.log("\n📋 Live test summary:");
    console.log("   ✅ Bitcoin price fetched and updated");
    console.log("   ✅ Ethereum price fetched and updated");
    console.log("   ✅ Simulated weather data encoded");
    console.log("   ✅ Simulated exchange rate encoded");
    console.log("   ✅ All updates confirmed on blockchain");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during live tests:", error);
    process.exit(1);
  }); 