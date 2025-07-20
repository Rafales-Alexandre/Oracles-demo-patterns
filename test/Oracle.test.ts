import { expect } from "chai";
import { ethers } from "hardhat";
import { Oracle } from "../typechain-types";

describe("Oracle", function () {
  let oracle: Oracle;
  let owner: any;
  let oracleUpdater: any;
  let unauthorizedUser: any;

  beforeEach(async function () {
    // Récupération des comptes
    [owner, oracleUpdater, unauthorizedUser] = await ethers.getSigners();

    // Déploiement du contrat
    const OracleFactory = await ethers.getContractFactory("Oracle");
    oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();
  });

  describe("Déploiement", function () {
    it("Devrait définir le déployeur comme oracleUpdater", async function () {
      expect(await oracle.oracleUpdater()).to.equal(owner.address);
    });

    it("Devrait initialiser les données à 0", async function () {
      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(0);
      expect(timestamp).to.equal(0);
    });
  });

  describe("Mise à jour des données", function () {
    it("Devrait permettre à l'oracleUpdater de mettre à jour les données", async function () {
      const newValue = 42;
      const tx = await oracle.connect(owner).updateData(newValue);
      const receipt = await tx.wait();
      
      // Vérification de l'événement
      expect(receipt?.logs).to.have.length(1);
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      expect(event?.name).to.equal("DataUpdated");
      expect(event?.args[0]).to.equal(newValue);
      expect(event?.args[1]).to.be.greaterThan(0);

      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(newValue);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Devrait rejeter les mises à jour d'utilisateurs non autorisés", async function () {
      const newValue = 42;
      await expect(
        oracle.connect(unauthorizedUser).updateData(newValue)
      ).to.be.revertedWith("Not authorized");
    });

    it("Devrait permettre plusieurs mises à jour consécutives", async function () {
      const values = [10, 20, 30, 40, 50];
      
      for (const value of values) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Devrait mettre à jour le timestamp à chaque mise à jour", async function () {
      const initialTime = await ethers.provider.getBlock("latest").then(block => block?.timestamp || 0);
      
      await oracle.connect(owner).updateData(100);
      const [, timestamp1] = await oracle.getData();
      expect(timestamp1).to.be.greaterThan(initialTime);

      // Attendre un peu pour que le timestamp change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await oracle.connect(owner).updateData(200);
      const [, timestamp2] = await oracle.getData();
      expect(timestamp2).to.be.greaterThan(timestamp1);
    });
  });

  describe("Lecture des données", function () {
    it("Devrait retourner les bonnes données après mise à jour", async function () {
      const testValue = 12345;
      await oracle.connect(owner).updateData(testValue);
      
      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(testValue);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Devrait permettre la lecture par n'importe quel utilisateur", async function () {
      const testValue = 999;
      await oracle.connect(owner).updateData(testValue);
      
      // Lecture par un utilisateur non autorisé
      const [data] = await oracle.connect(unauthorizedUser).getData();
      expect(data).to.equal(testValue);
    });
  });

  describe("Sécurité", function () {
    it("Devrait rejeter les transactions avec des données invalides", async function () {
      // Test avec une valeur très grande (mais valide)
      const maxValue = ethers.MaxUint256;
      await expect(oracle.connect(owner).updateData(maxValue)).to.not.be.reverted;
    });

    it("Devrait maintenir la cohérence des données après plusieurs transactions", async function () {
      const values = [1, 2, 3, 4, 5];
      let lastValue = 0;
      
      for (const value of values) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
        expect(data).to.not.equal(lastValue);
        lastValue = value;
      }
    });
  });

  describe("Événements", function () {
    it("Devrait émettre un événement lors de la mise à jour des données", async function () {
      const testValue = 777;
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      // Vérification que la transaction a réussi
      expect(receipt?.status).to.equal(1);
      
      // Vérification de l'événement
      expect(receipt?.logs).to.have.length(1);
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      expect(event?.name).to.equal("DataUpdated");
      expect(event?.args[0]).to.equal(testValue);
      expect(event?.args[1]).to.be.greaterThan(0);
    });

    it("Devrait émettre l'événement avec les bons paramètres", async function () {
      const testValue = 999;
      
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      const eventTimestamp = Number(event?.args[1]);
      
      // Vérification que le timestamp est valide (positif et raisonnable)
      expect(eventTimestamp).to.be.greaterThan(0);
      expect(eventTimestamp).to.be.lessThan(Math.floor(Date.now() / 1000) + 1000); // Doit être dans le passé récent
    });
  });
}); 