import { ethers } from "ethers"

export async function tryUtils() {
    const coder = new ethers.AbiCoder
    const code = coder.encode(["string"], ["Hello world"])
    console.log(`${code}`)

    const address = ethers.getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72");



    const from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
    const nonce = 5;

    // ethers.({ from, nonce });
    // '0x082B6aC9e47d7D83ea3FaBbD1eC7DAba9D687b36'
}