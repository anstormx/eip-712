"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ethers, Signature } from 'ethers';
import Messager from '../../artifacts/contracts/Messager.sol/Messager.json';
import { useAccount } from 'wagmi';
import { useIsMounted } from '@/hooks/useIsMounted';
import { toast } from 'react-toastify';

require('dotenv').config();

const NEXT_PUBLIC_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);
const NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS;
const NEXT_PUBLIC_INFURA_API = process.env.NEXT_PUBLIC_INFURA_API;

export default function Home() {
  const [accountAddress, setAccountAddress] = useState('');
  const [web3Message, setWeb3Message] = useState('');
  const [contractState, setContractState] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageDeadline, setMessageDeadline] = useState('');
  const [signature, setSignature] = useState('');
  const [messageTextRelay, setMessageTextRelay] = useState('');
  const [messageDeadlineRelay, setMessageDeadlineRelay] = useState('');
  const [messageSenderKeyRelay, setMessageSenderKeyRelay] = useState('');
  const [signatureRelay, setSignatureRelay] = useState('');
  const [messageSender, setMessageSender] = useState('');
  const [txHash, setTxHash] = useState('');

  const { address, isConnected } = useAccount();

  const isMounted = useIsMounted();

  const providerInfura = useMemo(() => new ethers.InfuraProvider(
    "sepolia",
    NEXT_PUBLIC_INFURA_API,
  ), []);

  const messagerContract = useMemo(() => new ethers.Contract(
    process.env.NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS,
    Messager.abi,
    providerInfura
  ), [providerInfura]);

  const signMessage = useCallback(async () => {
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
        chainId: NEXT_PUBLIC_NETWORK_ID, // change to the network id
        verifyingContract: NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS, // change to the contract address
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
          EIP712Domain: EIP712Domain,
          MessageStruct: MessageStruct
        },
        primaryType: 'MessageStruct',
        message: messageData,
      });

      const rawSignature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [accountAddress, msgParams],
      });

      setSignature('Signature: ' + rawSignature);

      toast.success('Message signed successfully!');

      let recoveredAddress = ethers.verifyTypedData(domainData, {MessageStruct}, messageData, rawSignature);
      console.log('Recovered:', recoveredAddress);
      console.log('Account:', accountAddress);

      setSignatureRelay(rawSignature);
      setMessageDeadlineRelay(messageDeadline);
      setMessageTextRelay(messageText);
      setMessageSender(accountAddress);

    } catch (error) {
      console.log('Error signing message:', error);
      toast.error('Error signing message!, check console for more details');
    }
  }, [messageText, messageDeadline, accountAddress]);

  const relayMessage = useCallback(async () => {
    const sig = Signature.from(signatureRelay);

    const wallet = new ethers.Wallet(messageSenderKeyRelay, providerInfura);
    const walletAddress = await wallet.getAddress();

    const nonce = await providerInfura.getTransactionCount(walletAddress);

    const functionData = messagerContract.interface.encodeFunctionData("message", [
      [messageTextRelay, Number(messageDeadlineRelay)],
      messageSender,
      sig.v,
      sig.r,
      sig.s
    ]); 

    const gasPrice = await providerInfura.getFeeData();

    let estimatedGas = await providerInfura.estimateGas({
      from: walletAddress,
      to: NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS,
      data: functionData,
    });

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
    
    try {
      toast.info('Sending transaction...');
      const tx = await wallet.sendTransaction(transaction);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      toast.success('Transaction was mined in block: ' + receipt.blockNumber);
      updateState();
    } catch (error) {
      console.log('Error sending transaction:', error);
      toast.error('Error sending transaction!, check console for more details');
    }
  }, [messageTextRelay, messageDeadlineRelay, messageSenderKeyRelay, signatureRelay, messageSender]);

  const updateState = async () => {
    if (isConnected && address) {
      setAccountAddress(address);
      setWeb3Message('');
      try {
        const textMessage = await messagerContract.textMessage();
        const messageSender = await messagerContract.messageSender();
        setContractState(`Text: ${textMessage} | Sender: ${messageSender}`);
      } catch (error) {
        console.error("Error fetching contract state:", error);
        setContractState("Error fetching contract state");
      }
    } else {
      setWeb3Message('Please connect to your wallet');
      setContractState('');
    }
  };

  useEffect(() => {
    if (isMounted) {
      updateState();
    }
  }, [isConnected, address, isMounted, messagerContract]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 mt-10">
      {!isConnected ? 
        <p>{web3Message}</p>
      :
        <div className=''> 
          <p>{contractState}</p>
          <h3 className="text-xl font-bold mt-2">Sign Message</h3>
          <div className="flex flex-col items-center space-y-2 mt-4">
            <span>Message Text</span>
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
            <button className="bg-blue-500 w-36 mx-auto hover:bg-blue-700 hover:transition-colors text-white font-bold py-2 px-4 rounded-lg" 
              onClick={signMessage}>
              Sign Message
            </button>
            <p>{signature}</p>
          </div>
        </div>
      }

      <h3 className="text-xl font-bold">Verify Message</h3>
      <div className="flex flex-col items-center space-y-2">
        <span>Message Text</span>
        <input
          type="text"
          value={messageTextRelay}
          onChange={(e) => setMessageTextRelay(e.target.value)}
          className="input text-black"
        />
        <span>Message Deadline (in epoch)</span>
        <input
          type="text"
          value={messageDeadlineRelay}
          onChange={(e) => setMessageDeadlineRelay(e.target.value)}
          className="input text-black"
        />
        <span>Message Signer Address</span>
        <input
          type="text"
          value={messageSender}
          onChange={(e) => setMessageSender(e.target.value)}
          className="input text-black"
        />
        <span>Transaction Signer Private Key</span>
        <input
          type="text"
          value={messageSenderKeyRelay}
          onChange={(e) => setMessageSenderKeyRelay(e.target.value)}
          className="input text-black"
        />
        <span>Signature</span>
        <input
          type="text"
          value={signatureRelay}
          onChange={(e) => setSignatureRelay(e.target.value)}
          className="input text-black"
        />
        <button className="bg-blue-500 w-36 mx-auto hover:bg-blue-700 hover:transition-colors font-bold py-2 px-4 rounded-lg" 
          onClick={relayMessage}>
          Relay
        </button>
        <p>{txHash}</p>
      </div>
    </div>
  );
}