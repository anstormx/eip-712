// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Messager is EIP712 {
    string public textMessage = "Hello World!";
    address public messageSender;

    struct MessageStruct {
        string text;
        uint256 deadline;
    }

    bytes32 immutable private MESSAGE_TYPEHASH = keccak256("MessageStruct(string text,uint256 deadline)");

    event MessageChanged(string text, address sender);

    constructor () EIP712("Messager", "1") {}

    // Hash the Message struct
    function hashMessage(MessageStruct memory messageStruct) internal view returns (bytes32) {
        return keccak256(abi.encode(
            MESSAGE_TYPEHASH,
            keccak256(bytes(messageStruct.text)),
            messageStruct.deadline
        ));
    }

    // Verify that a message was signed by the owner of the given address
    function verifyMessage(MessageStruct calldata messageStruct, address sender, bytes memory signature) public view returns (bool) {
        // Hash the message
        bytes32 digest = _hashTypedDataV4(hashMessage(messageStruct));

        // Recover the signer's address
        address recoveredAddress = ECDSA.recover(digest, signature);

        console.log("Recovered address: %s", recoveredAddress);
        console.log("Sender address: %s", sender);

        // Return true if the recovered address matches the sender
        return recoveredAddress == sender;
    }

    function message(MessageStruct calldata messageStruct, address sender, bytes memory signature) public {
        // verify the signature and that the deadline has not passed
        require(verifyMessage(messageStruct, sender, signature), "SIGNATURE DOES NOT MATCH");
        require(block.timestamp <= messageStruct.deadline, "DEADLINE HAS BEEN REACHED");

        // update the message and sender
        textMessage = messageStruct.text;
        messageSender = sender;

        // emit an event
        emit MessageChanged(textMessage, messageSender);
    }
}