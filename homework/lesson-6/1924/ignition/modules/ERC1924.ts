import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC1924Module", (m) => {
  const counter = m.contract("ERC1924");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
