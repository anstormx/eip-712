// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract Messager {
    string public textMessage = "Hello World!";
    address public messageSender = msg.sender;

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct MessageStruct {
        string text;
        uint256 deadline;
    }

    bytes32 immutable private DOMAIN_SEPARATOR;
    bytes32 immutable private MESSAGE_TYPEHASH;
    bytes32 immutable private DOMAIN_TYPEHASH;

    event MessageChanged(string text, address sender);

    constructor () {
        MESSAGE_TYPEHASH = keccak256("MessageStruct(string text,uint256 deadline)");
        
        DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
  
        DOMAIN_SEPARATOR = hashDomain(EIP712Domain({
            name: "Messager",
            version: "1",
            chainId: block.chainid,
            verifyingContract: address(this)
        }));
    }
    
    // Hash the EIP712 Domain struct
    function hashDomain(EIP712Domain memory domain) internal view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes(domain.name)),
            keccak256(bytes(domain.version)),
            domain.chainId,
            domain.verifyingContract
        ));
    }

    // Hash the Message struct
    function hashMessage(MessageStruct memory messageStruct) internal view returns (bytes32) {
        return keccak256(abi.encode(
            MESSAGE_TYPEHASH,
            keccak256(bytes(messageStruct.text)),
            messageStruct.deadline
        ));
    }

    // Verify that a message was signed by the owner of the given address
    function verifyMessage(MessageStruct memory messageStruct, address sender, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        // concatenate EIP712Domain separator and Message struct hash to create the digest
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            hashMessage(messageStruct)
        ));

        // Recover the signer's address
        address recoveredAddress = ecrecover(hash, v, r, s);

        console.log("Recovered address: %s", recoveredAddress);
        console.log("Sender address: %s", sender);

        // Return true if the recovered address matches the sender
        return recoveredAddress == sender;
    }

    function message(MessageStruct memory messageStruct, address sender, uint8 v, bytes32 r, bytes32 s) public {
        // verify the signature and that the deadline has not passed
        require(verifyMessage(messageStruct, sender, v, r, s), "SIGNATURE DOES NOT MATCH");
        require(block.timestamp <= messageStruct.deadline, "DEADLINE HAS BEEN REACHED");

        // update the message and sender
        textMessage = messageStruct.text;
        messageSender = sender;

        // emit an event
        emit MessageChanged(textMessage, messageSender);
    }
}