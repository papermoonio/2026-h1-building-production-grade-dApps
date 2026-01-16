import { ethers } from "ethers";
import { getProvider } from "./utils.ts";

const identity_precompile = "0x0000000000000000000000000000000000000004";
const hash_precompile = "0x0000000000000000000000000000000000000002";

export async function callWithoutSelector(provider: ethers.JsonRpcProvider) {
  const result = await provider.call({
    to: identity_precompile,
    data: "0x12345678",
  });

  console.log("Result:", result);
}
async function main() {
  const provider = getProvider(true);
  await callWithoutSelector(provider);
}

main();
