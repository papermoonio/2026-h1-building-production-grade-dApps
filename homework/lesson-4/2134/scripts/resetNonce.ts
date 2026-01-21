import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(signer.address, "pending");
  console.log("当前 pending nonce:", nonce);

  // 发送一笔空交易给自己来推进 nonce
  const tx = await signer.sendTransaction({
    to: signer.address,
    value: 0
  });

  console.log("重置交易已发送:", tx.hash);
  await tx.wait();
  console.log("确认! 现在可以重新运行 npm run deploy");
}

main().catch(console.error);
