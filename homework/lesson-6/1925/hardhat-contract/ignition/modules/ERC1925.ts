import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC1925Module", (m) => {
  const counter = m.contract("ERC1925");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
