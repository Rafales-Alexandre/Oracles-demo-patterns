import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du contrat Oracle...");

  // Récupération du signer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  console.log("💰 Balance du compte:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Déploiement du contrat
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();
  console.log("✅ Contrat Oracle déployé à l'adresse:", oracleAddress);

  // Vérification de l'état initial
  const [initialData, initialTimestamp] = await oracle.getData();
  console.log("📊 Données initiales:", {
    data: initialData.toString(),
    timestamp: initialTimestamp.toString(),
  });

  // Vérification de l'oracle updater
  const oracleUpdater = await oracle.oracleUpdater();
  console.log("🔑 Oracle Updater:", oracleUpdater);

  console.log("🎉 Déploiement terminé avec succès!");
  
  return {
    oracleAddress,
    oracleUpdater,
    deployer: deployer.address,
  };
}

main()
  .then((result) => {
    console.log("\n📋 Résumé du déploiement:");
    console.log("   - Adresse du contrat:", result.oracleAddress);
    console.log("   - Oracle Updater:", result.oracleUpdater);
    console.log("   - Déployeur:", result.deployer);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement:", error);
    process.exit(1);
  }); 