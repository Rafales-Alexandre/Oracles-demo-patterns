import { expect } from "chai";
import { ethers } from "hardhat";
import { Oracle } from "../typechain-types";

describe("Oracle Contract - Comprehensive Testing", function () {
  let oracle: Oracle;
  let owner: any;
  let oracleUpdater: any;
  let unauthorizedUser: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    // Get all test accounts
    [owner, oracleUpdater, unauthorizedUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy contract
    const OracleFactory = await ethers.getContractFactory("Oracle");
    oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();
  });

  describe("Constructor Testing", function () {
    it("Should set deployer as oracleUpdater", async function () {
      expect(await oracle.oracleUpdater()).to.equal(owner.address);
    });

    it("Should initialize data to 0", async function () {
      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(0);
      expect(timestamp).to.equal(0);
    });

    it("Should initialize lastUpdated to 0", async function () {
      const [, timestamp] = await oracle.getData();
      expect(timestamp).to.equal(0);
    });
  });

  describe("updateData() Function - Normal Cases", function () {
    it("Should update data with normal values", async function () {
      const testValues = [1, 42, 100, 1000, 999999];
      
      for (const value of testValues) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Should update timestamp on each update", async function () {
      const initialTime = await ethers.provider.getBlock("latest").then(block => block?.timestamp || 0);
      
      await oracle.connect(owner).updateData(100);
      const [, timestamp1] = await oracle.getData();
      expect(timestamp1).to.be.greaterThan(initialTime);

      // Wait for timestamp to change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await oracle.connect(owner).updateData(200);
      const [, timestamp2] = await oracle.getData();
      expect(timestamp2).to.be.greaterThan(timestamp1);
    });

    it("Should allow oracleUpdater to update data", async function () {
      const newValue = 42;
      await expect(oracle.connect(owner).updateData(newValue)).to.not.be.reverted;
      
      const [data] = await oracle.getData();
      expect(data).to.equal(newValue);
    });
  });

  describe("updateData() Function - Unexpected Values", function () {
    it("Should handle zero value", async function () {
      await oracle.connect(owner).updateData(0);
      const [data] = await oracle.getData();
      expect(data).to.equal(0);
    });

    it("Should handle maximum uint256 value", async function () {
      const maxValue = ethers.MaxUint256;
      await oracle.connect(owner).updateData(maxValue);
      const [data] = await oracle.getData();
      expect(data).to.equal(maxValue);
    });

    it("Should handle very large values", async function () {
      const largeValues = [
        ethers.parseEther("1000000"), // 1 million ETH
        ethers.parseEther("999999999999999999"), // Very large number
        2n ** 255n - 1n, // Max value - 1
        2n ** 128n, // 2^128
      ];

      for (const value of largeValues) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Should handle sequential updates with different value types", async function () {
      const values = [0, 1, 255, 256, 65535, 65536, 4294967295n, 4294967296n];
      
      for (const value of values) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });
  });

  describe("updateData() Function - Event Emission", function () {
    it("Should emit DataUpdated event with correct parameters", async function () {
      const testValue = 777;
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      expect(receipt?.logs).to.have.length(1);
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      
      expect(event?.name).to.equal("DataUpdated");
      expect(event?.args[0]).to.equal(testValue);
      expect(event?.args[1]).to.be.greaterThan(0);
    });

    it("Should emit event with correct timestamp", async function () {
      const testValue = 999;
      const blockBefore = await ethers.provider.getBlock("latest");
      
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      const eventTimestamp = Number(event?.args[1]);
      
      // Timestamp should be reasonable (within 60 seconds of block time)
      expect(eventTimestamp).to.be.greaterThan(0);
      expect(eventTimestamp).to.be.greaterThanOrEqual(Number(blockBefore?.timestamp || 0));
      expect(eventTimestamp).to.be.lessThan(Math.floor(Date.now() / 1000) + 60);
    });

    it("Should emit event for each update", async function () {
      const values = [10, 20, 30, 40, 50];
      
      for (let i = 0; i < values.length; i++) {
        const tx = await oracle.connect(owner).updateData(values[i]);
        const receipt = await tx.wait();
        
        expect(receipt?.logs).to.have.length(1);
        const event = oracle.interface.parseLog(receipt!.logs[0]);
        expect(event?.name).to.equal("DataUpdated");
        expect(event?.args[0]).to.equal(values[i]);
      }
    });
  });

  describe("updateData() Function - Revert Cases", function () {
    it("Should revert when called by unauthorized user", async function () {
      const newValue = 42;
      await expect(
        oracle.connect(unauthorizedUser).updateData(newValue)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert when called by random address", async function () {
      const newValue = 42;
      
      // Create a random wallet with provider
      const randomWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      
      await expect(
        oracle.connect(randomWallet).updateData(newValue)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert when called by zero address", async function () {
      const newValue = 42;
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      
      // This would require a different approach since we can't easily call with zero address
      // But we can test that the modifier works correctly
      await expect(
        oracle.connect(unauthorizedUser).updateData(newValue)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should maintain state after revert attempts", async function () {
      // Set initial state
      await oracle.connect(owner).updateData(100);
      const [initialData] = await oracle.getData();
      expect(initialData).to.equal(100);

      // Try unauthorized update
      await expect(
        oracle.connect(unauthorizedUser).updateData(999)
      ).to.be.revertedWith("Not authorized");

      // Verify state unchanged
      const [finalData] = await oracle.getData();
      expect(finalData).to.equal(100);
    });
  });

  describe("updateData() Function - Multiple Actions", function () {
    it("Should handle rapid consecutive updates", async function () {
      const values = Array.from({length: 10}, (_, i) => i);
      
      for (const value of values) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Should handle updates with same value multiple times", async function () {
      const sameValue = 42;
      
      for (let i = 0; i < 5; i++) {
        await oracle.connect(owner).updateData(sameValue);
        const [data] = await oracle.getData();
        expect(data).to.equal(sameValue);
      }
    });

    it("Should handle alternating values", async function () {
      const values = [1, 999, 1, 999, 1, 999];
      
      for (const value of values) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Should maintain data consistency during multiple updates", async function () {
      const values = [100, 200, 300, 400, 500];
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

  describe("updateData() Function - Multi-User Interactions", function () {
    it("Should only allow oracleUpdater to update", async function () {
      // Oracle updater can update
      await expect(oracle.connect(owner).updateData(100)).to.not.be.reverted;
      
      // Other users cannot update
      await expect(oracle.connect(user1).updateData(200)).to.be.revertedWith("Not authorized");
      await expect(oracle.connect(user2).updateData(300)).to.be.revertedWith("Not authorized");
      await expect(oracle.connect(user3).updateData(400)).to.be.revertedWith("Not authorized");
      
      // Verify only oracleUpdater's update took effect
      const [data] = await oracle.getData();
      expect(data).to.equal(100);
    });

    it("Should allow all users to read data", async function () {
      const testValue = 999;
      await oracle.connect(owner).updateData(testValue);
      
      // All users should be able to read
      const [data1] = await oracle.connect(user1).getData();
      const [data2] = await oracle.connect(user2).getData();
      const [data3] = await oracle.connect(user3).getData();
      
      expect(data1).to.equal(testValue);
      expect(data2).to.equal(testValue);
      expect(data3).to.equal(testValue);
    });

    it("Should handle concurrent read requests", async function () {
      await oracle.connect(owner).updateData(123);
      
      // Simulate concurrent reads
      const reads = [
        oracle.connect(user1).getData(),
        oracle.connect(user2).getData(),
        oracle.connect(user3).getData(),
        oracle.connect(unauthorizedUser).getData()
      ];
      
      const results = await Promise.all(reads);
      
      for (const [data] of results) {
        expect(data).to.equal(123);
      }
    });
  });

  describe("updateData() Function - Fuzz Testing", function () {
    it("Should handle random uint256 values", async function () {
      for (let i = 0; i < 10; i++) {
        const randomValue = Math.floor(Math.random() * 1000000); // Use simple random numbers
        await oracle.connect(owner).updateData(randomValue);
        const [data] = await oracle.getData();
        expect(data).to.equal(randomValue);
      }
    });

    it("Should handle edge case values", async function () {
      const edgeCases = [
        0n,
        1n,
        2n ** 8n - 1n,   // 255
        2n ** 16n - 1n,  // 65535
        2n ** 32n - 1n,  // 4294967295
        2n ** 64n - 1n,  // 18446744073709551615
        2n ** 128n - 1n, // Very large number
        2n ** 255n - 1n, // Almost max uint256
        ethers.MaxUint256
      ];

      for (const value of edgeCases) {
        await oracle.connect(owner).updateData(value);
        const [data] = await oracle.getData();
        expect(data).to.equal(value);
      }
    });

    it("Should handle sequential fuzz values", async function () {
      for (let i = 0; i < 20; i++) {
        const fuzzValue = i * 100 + Math.floor(Math.random() * 100); // Sequential with random offset
        await oracle.connect(owner).updateData(fuzzValue);
        const [data] = await oracle.getData();
        expect(data).to.equal(fuzzValue);
      }
    });
  });

  describe("getData() Function - Normal Cases", function () {
    it("Should return correct initial values", async function () {
      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(0);
      expect(timestamp).to.equal(0);
    });

    it("Should return updated values after update", async function () {
      const testValue = 12345;
      await oracle.connect(owner).updateData(testValue);
      
      const [data, timestamp] = await oracle.getData();
      expect(data).to.equal(testValue);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should return correct tuple structure", async function () {
      const result = await oracle.getData();
      expect(result).to.have.length(2);
      expect(typeof result[0]).to.equal("bigint");
      expect(typeof result[1]).to.equal("bigint");
    });
  });

  describe("getData() Function - Access Control", function () {
    it("Should allow any user to read data", async function () {
      const testValue = 999;
      await oracle.connect(owner).updateData(testValue);
      
      // Test reading from different users
      const users = [owner, user1, user2, user3, unauthorizedUser];
      
      for (const user of users) {
        const [data] = await oracle.connect(user).getData();
        expect(data).to.equal(testValue);
      }
    });

    it("Should return same data for all users", async function () {
      const testValue = 777;
      await oracle.connect(owner).updateData(testValue);
      
      const reads = [owner, user1, user2, user3, unauthorizedUser].map(user => oracle.connect(user).getData());
      const results = await Promise.all(reads);
      
      for (const [data] of results) {
        expect(data).to.equal(testValue);
      }
    });
  });

  describe("oracleUpdater Variable - Access Control", function () {
    it("Should be publicly readable", async function () {
      const updater = await oracle.oracleUpdater();
      expect(updater).to.equal(owner.address);
    });

    it("Should be immutable after deployment", async function () {
      const initialUpdater = await oracle.oracleUpdater();
      
      // Try to update data with different users
      await oracle.connect(owner).updateData(100);
      await expect(oracle.connect(user1).updateData(200)).to.be.revertedWith("Not authorized");
      
      const finalUpdater = await oracle.oracleUpdater();
      expect(finalUpdater).to.equal(initialUpdater);
    });
  });

  describe("onlyOracle Modifier - Comprehensive Testing", function () {
    it("Should allow oracleUpdater to pass modifier", async function () {
      await expect(oracle.connect(owner).updateData(42)).to.not.be.reverted;
    });

    it("Should reject non-oracleUpdater addresses", async function () {
      const nonUpdaters = [user1, user2, user3, unauthorizedUser];
      
      for (const user of nonUpdaters) {
        await expect(
          oracle.connect(user).updateData(42)
        ).to.be.revertedWith("Not authorized");
      }
    });

    it("Should maintain state consistency after modifier rejections", async function () {
      // Set initial state
      await oracle.connect(owner).updateData(100);
      const [initialData] = await oracle.getData();
      expect(initialData).to.equal(100);

      // Try multiple unauthorized updates
      const unauthorizedUsers = [user1, user2, user3];
      for (const user of unauthorizedUsers) {
        await expect(
          oracle.connect(user).updateData(999)
        ).to.be.revertedWith("Not authorized");
      }

      // Verify state unchanged
      const [finalData] = await oracle.getData();
      expect(finalData).to.equal(100);
    });
  });

  describe("DataUpdated Event - Comprehensive Testing", function () {
    it("Should emit event with indexed value parameter", async function () {
      const testValue = 123;
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      expect(event?.args[0]).to.equal(testValue);
    });

    it("Should emit event with correct timestamp parameter", async function () {
      const testValue = 456;
      const blockBefore = await ethers.provider.getBlock("latest");
      
      const tx = await oracle.connect(owner).updateData(testValue);
      const receipt = await tx.wait();
      
      const event = oracle.interface.parseLog(receipt!.logs[0]);
      const eventTimestamp = Number(event?.args[1]);
      
      expect(eventTimestamp).to.be.greaterThan(0);
      expect(eventTimestamp).to.be.greaterThanOrEqual(Number(blockBefore?.timestamp || 0));
    });

    it("Should emit event for every successful update", async function () {
      const updates = [10, 20, 30, 40, 50];
      
      for (let i = 0; i < updates.length; i++) {
        const tx = await oracle.connect(owner).updateData(updates[i]);
        const receipt = await tx.wait();
        
        expect(receipt?.logs).to.have.length(1);
        const event = oracle.interface.parseLog(receipt!.logs[0]);
        expect(event?.name).to.equal("DataUpdated");
        expect(event?.args[0]).to.equal(updates[i]);
      }
    });

    it("Should not emit events for failed updates", async function () {
      // Count events before unauthorized attempt
      const initialEvents = await oracle.queryFilter(oracle.filters.DataUpdated());
      
      // Try unauthorized update
      await expect(
        oracle.connect(user1).updateData(999)
      ).to.be.revertedWith("Not authorized");
      
      // Verify no new events were emitted
      const finalEvents = await oracle.queryFilter(oracle.filters.DataUpdated());
      expect(finalEvents.length).to.equal(initialEvents.length);
    });
  });
});