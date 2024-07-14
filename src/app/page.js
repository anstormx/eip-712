"use client";

import React, { useState } from 'react';
import { ethers, getAddress, N, Signature } from 'ethers';
import Messager from '../../artifacts/contracts/Messager.sol/Messager.json';
require('dotenv').config();

const NEXT_PUBLIC_PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
const NEXT_PUBLIC_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);
const NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS;
const NEXT_PUBLIC_BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const NEXT_PUBLIC_INFURA_API = process.env.NEXT_PUBLIC_INFURA_API;


export default function Home() {
  const [accountAddress, setAccountAddress] = useState('');
  const [web3Message, setWeb3Message] = useState('Please connect to your wallet');
  const [contractState, setContractState] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageDeadline, setMessageDeadline] = useState('');
  const [signature, setSignature] = useState('');
  const [messageTextRelay, setMessageTextRelay] = useState('');
  const [messageDeadlineRelay, setMessageDeadlineRelay] = useState('');
  const [messageSenderRelay, setMessageSenderRelay] = useState('');
  const [signatureRelay, setSignatureRelay] = useState('');

  const providerInfura = new ethers.InfuraProvider(
    "sepolia",
    NEXT_PUBLIC_INFURA_API,
  );

  const messagerContract = new ethers.Contract(NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS, Messager.abi, providerInfura);

  //add metamask reload callback
  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log(accounts);
    setAccountAddress(getAddress(accounts[0]));
    setWeb3Message('You are connected to the wallet!');
    setContractState(`textMessage: ${await messagerContract.textMessage()} | messageSender: ${await messagerContract.messageSender() }`);
  };

  async function signMessage () {
    try {
      const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ];

      const domainData = {
        name: 'Messager',
        version: '1', 
        chainId: NEXT_PUBLIC_NETWORK_ID,
        verifyingContract: NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS,
      };

      const MessageStruct = [
        { name: 'text', type: 'string' },
        { name: 'deadline', type: 'uint256' }
      ]

      const messageData = {
        text: messageText,
        deadline: Number(messageDeadline),
      };

      const msgParams = JSON.stringify({
        domain: domainData,
        types: {
          MessageStruct: MessageStruct,
          EIP712Domain: EIP712Domain,
        },
        primaryType: 'MessageStruct',
        message: messageData,
      });

      const rawSignature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [accountAddress, msgParams],
      });

      console.log('Signature:', rawSignature);
      setSignature(rawSignature);

      let recoveredAddress = ethers.verifyTypedData(domainData, {MessageStruct}, messageData, rawSignature);
      console.log('Recovered:', recoveredAddress);

      setMessageSenderRelay(recoveredAddress);
      setSignatureRelay(rawSignature);
      setMessageDeadlineRelay(messageDeadline);
      setMessageTextRelay(messageText);

    } catch (error) {
      console.log('Error signing message:', error);
    }
  }

  async function relayMessage () {
    const sig = Signature.from(signatureRelay);

    const wallet = new ethers.Wallet(NEXT_PUBLIC_PRIVATE_KEY, providerInfura);
    const walletAddress = await wallet.getAddress();

    const nonce = await providerInfura.getTransactionCount(walletAddress);
    console.log("Nonce", nonce);

    const functionData = messagerContract.interface.encodeFunctionData("message", [
      [messageTextRelay, Number(messageDeadlineRelay)],
      messageSenderRelay,
      sig.v,
      sig.r,
      sig.s
    ]); 

    const gasPrice = await providerInfura.getFeeData();
    console.log("Gas Price", gasPrice);

    let estimatedGas = await providerInfura.estimateGas({
      from: walletAddress,
      to: NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS,
      data: functionData,
    });
    console.log("Estimated Gas", estimatedGas);

    const transaction = {
      'from': walletAddress,
      'to': NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS,
      'value': 0,
      'nonce': nonce,
      'data': functionData,
      'chainId': NEXT_PUBLIC_NETWORK_ID,
      'gasLimit': estimatedGas,
      'maxFeePerGas': gasPrice.maxFeePerGas,
      'maxPriorityFeePerGas': gasPrice.maxPriorityFeePerGas,
    };

    console.log("Transaction", transaction);
    
    const signedTx = await wallet.signTransaction(transaction);
    console.log("signedTx", signedTx);

    try {
      console.log("Sending transaction...");
      const tx = await wallet.sendTransaction(transaction);
      console.log("🎉 The hash of your transaction is: ", tx.hash, "\n");
      const receipt = await tx.wait();
      console.log("🎉 The transaction was mined in block: ", receipt.blockNumber, "\n");
      alert("Message sent!");
    } catch (error) {
      console.log("❗Something went wrong while submitting your transaction:", error);
      alert("Error sending message!");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <button className="btn" onClick={connectWallet}>
        Connect Wallet
      </button>
      <p>{accountAddress}</p>
      <h1 className="text-2xl font-bold">Message Verifier</h1>
      <p>{web3Message}</p>
      <p>{contractState}</p>

      <h3 className="text-xl font-semibold">Sign Message</h3>
      <div className="flex flex-col items-center space-y-2">
        <span>Text Message</span>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="input text-black"
        />
        <span>Message Deadline (in epoch)</span>
        <input
          type="text"
          value={messageDeadline}
          onChange={(e) => setMessageDeadline(e.target.value)}
          className="input text-black"
        />
        <button className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg" 
          onClick={signMessage}>
          Sign Message
        </button>
        <p>{signature}</p>
      </div>

      <h3 className="text-xl font-semibold">Verify Message</h3>
      <div className="flex flex-col items-center space-y-2">
        <span>Message Text</span>
        <input
          type="text"
          value={messageTextRelay}
          onChange={(e) => setMessageTextRelay(e.target.value)}
          className="input text-black"
        />
        <span>Message Deadline</span>
        <input
          type="text"
          value={messageDeadlineRelay}
          onChange={(e) => setMessageDeadlineRelay(e.target.value)}
          className="input text-black"
        />
        <span>Message Sender</span>
        <input
          type="text"
          value={messageSenderRelay}
          onChange={(e) => setMessageSenderRelay(e.target.value)}
          className="input text-black"
        />
        <span>Signature</span>
        <input
          type="text"
          value={signatureRelay}
          onChange={(e) => setSignatureRelay(e.target.value)}
          className="input text-black"
        />
        <button className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg" 
          onClick={relayMessage}>
          Relay
        </button>
      </div>
    </div>
  );
}