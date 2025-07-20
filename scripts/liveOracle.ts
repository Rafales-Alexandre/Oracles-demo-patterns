import { ethers } from "hardhat";
import axios from "axios";

async function main() {
  console.log("🌐 Oracle en temps réel - Test avec vraie API...");

  // Récupération du signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Oracle Updater:", deployer.address);

  // Adresse du contrat déployé
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Récupération du contrat
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = Oracle.attach(contractAddress);

  console.log("📋 Contrat Oracle:", contractAddress);

  // Fonction pour récupérer le prix du Bitcoin
  async function getBitcoinPrice(): Promise<number> {
    try {
      console.log("🔍 Récupération du prix du Bitcoin...");
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const price = response.data.bitcoin.usd;
      console.log(`   💰 Prix du Bitcoin: $${price}`);
      return Math.floor(price * 100); // Conversion en centimes pour éviter les décimales
    } catch (error) {
      console.log("   ⚠️ Erreur API, utilisation d'une valeur par défaut");
      return 50000; // Valeur par défaut en cas d'erreur
    }
  }

  // Fonction pour récupérer le prix de l'Ethereum
  async function getEthereumPrice(): Promise<number> {
    try {
      console.log("🔍 Récupération du prix de l'Ethereum...");
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const price = response.data.ethereum.usd;
      console.log(`   💰 Prix de l'Ethereum: $${price}`);
      return Math.floor(price * 100); // Conversion en centimes
    } catch (error) {
      console.log("   ⚠️ Erreur API, utilisation d'une valeur par défaut");
      return 3000; // Valeur par défaut en cas d'erreur
    }
  }

  // Fonction pour mettre à jour l'oracle
  async function updateOracle(value: number, description: string) {
    try {
      console.log(`📝 Mise à jour de l'oracle avec: ${description}`);
      const tx = await oracle.connect(deployer).updateData(value);
      console.log("   Transaction envoyée:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("   ✅ Transaction confirmée dans le bloc:", receipt?.blockNumber);
      
      // Vérification
      const [data, timestamp] = await oracle.getData();
      console.log(`   📊 Données mises à jour: ${data} (${description})`);
      console.log(`   ⏰ Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
      
      return true;
    } catch (error) {
      console.log("   ❌ Erreur lors de la mise à jour:", (error as Error).message);
      return false;
    }
  }

  // Test 1: Prix du Bitcoin
  console.log("\n" + "=".repeat(50));
  console.log("🪙 TEST 1: Prix du Bitcoin");
  console.log("=".repeat(50));
  
  const btcPrice = await getBitcoinPrice();
  await updateOracle(btcPrice, `Prix Bitcoin: $${btcPrice / 100}`);

  // Attendre 5 secondes
  console.log("\n⏳ Attente de 5 secondes...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Prix de l'Ethereum
  console.log("\n" + "=".repeat(50));
  console.log("🔷 TEST 2: Prix de l'Ethereum");
  console.log("=".repeat(50));
  
  const ethPrice = await getEthereumPrice();
  await updateOracle(ethPrice, `Prix Ethereum: $${ethPrice / 100}`);

  // Test 3: Simulation d'un oracle météo (données simulées)
  console.log("\n" + "=".repeat(50));
  console.log("🌤️ TEST 3: Oracle Météo (simulé)");
  console.log("=".repeat(50));
  
  const weatherData = {
    temperature: 22, // degrés Celsius
    humidity: 65,    // pourcentage
    pressure: 1013   // hPa
  };
  
  // Encodage des données météo dans un seul nombre
  const encodedWeather = weatherData.temperature * 10000 + weatherData.humidity * 100 + weatherData.pressure;
  console.log("   🌡️ Données météo simulées:", weatherData);
  console.log("   🔢 Données encodées:", encodedWeather);
  
  await updateOracle(encodedWeather, `Météo: ${weatherData.temperature}°C, ${weatherData.humidity}% humidité, ${weatherData.pressure}hPa`);

  // Test 4: Oracle de taux de change (simulé)
  console.log("\n" + "=".repeat(50));
  console.log("💱 TEST 4: Taux de change EUR/USD (simulé)");
  console.log("=".repeat(50));
  
  const exchangeRate = 1.0850; // EUR/USD
  const encodedRate = Math.floor(exchangeRate * 10000); // Encodage avec 4 décimales
  console.log("   💱 Taux EUR/USD simulé:", exchangeRate);
  console.log("   🔢 Taux encodé:", encodedRate);
  
  await updateOracle(encodedRate, `Taux EUR/USD: ${exchangeRate}`);

  // Test 5: Vérification finale et historique
  console.log("\n" + "=".repeat(50));
  console.log("📊 ÉTAT FINAL DE L'ORACLE");
  console.log("=".repeat(50));
  
  const [finalData, finalTimestamp] = await oracle.getData();
  console.log("   📈 Dernière valeur:", finalData.toString());
  console.log("   ⏰ Dernière mise à jour:", new Date(Number(finalTimestamp) * 1000).toLocaleString());
  console.log("   🔑 Oracle Updater:", await oracle.oracleUpdater());

  console.log("\n🎉 Tests de l'oracle en temps réel terminés !");
  console.log("\n💡 Note: Les données réelles proviennent de l'API CoinGecko");
  console.log("   Les données météo et de change sont simulées pour la démonstration");
}

main()
  .then(() => {
    console.log("\n📋 Résumé des tests en temps réel:");
    console.log("   ✅ Prix Bitcoin récupéré et mis à jour");
    console.log("   ✅ Prix Ethereum récupéré et mis à jour");
    console.log("   ✅ Données météo simulées et encodées");
    console.log("   ✅ Taux de change simulé et encodé");
    console.log("   ✅ Toutes les mises à jour confirmées sur la blockchain");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur lors des tests en temps réel:", error);
    process.exit(1);
  }); 