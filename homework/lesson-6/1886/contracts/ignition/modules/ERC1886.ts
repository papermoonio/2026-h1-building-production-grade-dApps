// ignition/modules/ERC1886.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC1886Module", (m) => {
  const token = m.contract("ERC1886", ["ERC1886", "ERC1886"]);

  return { token };
});
