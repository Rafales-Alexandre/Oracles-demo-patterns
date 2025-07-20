import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OracleDeployment", (m) => {
  const oracle = m.contract("Oracle", [], {
    from: m.deployer,
  });

  return { oracle };
}); 