import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenModule", (m) => {
  // Provide constructor arguments: name, symbol, initialSupply
  const token = m.contract("ERC1604FT", ["TestToken", "TTK", 1000n]);

  return { token };
});