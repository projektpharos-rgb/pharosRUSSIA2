import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

const CONTRACT_ADDRESS = "0x1F88A3883e2CA904f845d2737E7e1464d0DA2Da9";
const ABI = [
  "function mint() public payable",
  "function totalSupply() public view returns (uint256)",
  "function maxSupply() public view returns (uint256)"
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [supply, setSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(10000);

  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              rpc: {
                688688: "https://api.zan.top/node/v1/pharos/testnet/"
              }
            }
          }
        }
      });

      const instance = await web3Modal.connect();
        // Обработка событий WalletConnect
        if (instance && instance.on) {
          instance.on("accountsChanged", (accounts) => {
            if (accounts && accounts.length > 0) {
              setAccount(accounts[0]);
            } else {
              setAccount(null);
            }
          });
          instance.on("connect", (info) => {
            // Можно добавить логику при успешном подключении
          });
          instance.on("disconnect", () => {
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setContract(null);
          });
        }
      const prov = new ethers.BrowserProvider(instance);
      const signer = await prov.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setProvider(prov);
      setSigner(signer);
      setAccount(address);
      setContract(contract);
    } catch (err) {
      console.error("Ошибка подключения:", err);
    }
  };

  const mintNFT = async () => {
    if (!contract) return;
    try {
      const tx = await contract.mint({ value: 0 }); // минтим бесплатно, только газ
      await tx.wait();
      fetchSupply();
    } catch (err) {
      console.error("Ошибка минта:", err);
    }
  };

  const fetchSupply = async () => {
    if (!contract) return;
    try {
      const total = await contract.totalSupply();
      const max = await contract.maxSupply();
      setSupply(Number(total));
      setMaxSupply(Number(max));
    } catch (err) {
      console.error("Ошибка получения supply:", err);
    }
  };

  useEffect(() => {
    if (contract) fetchSupply();
  }, [contract]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage: "url('./PharosRussia.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="bg-black/60 p-6 rounded-2xl shadow-xl text-center max-w-lg">
        <img src="./PharosRossia.png" alt="NFT" className="w-40 mx-auto mb-4 rounded-xl shadow-lg" />
        <h1 className="text-3xl font-bold mb-2">Pharos Russia NFT</h1>
        <p className="mb-4 text-sm">
          Уникальные бейджи для русскоязычного сообщества в сети Pharos Testnet
        </p>
        <div className="mb-4">
          <p className="mb-2 text-base">Присоединяйтесь к русскому сообществу Pharos!</p>
          <a
            href="https://t.me/hrumdrops"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition"
          >
            Telegram-канал
          </a>
        </div>
        <p className="mb-4">Сминчено: {supply} / {maxSupply}</p>
        {account ? (
          <>
            <button
              onClick={mintNFT}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl shadow-md"
            >
              Минт NFT (только газ)
            </button>
            <p className="mt-3 text-xs break-all">Ваш адрес: {account}</p>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl shadow-md"
          >
            Подключить кошелёк
          </button>
        )}
      </div>
    </div>
  );
}