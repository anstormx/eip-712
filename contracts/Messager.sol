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

    bytes32 private constant MESSAGE_TYPEHASH = keccak256("MessageStruct(string text,uint256 deadline)");

    event MessageChanged(string text, address sender);

    constructor() EIP712("Messager", "1") {
        console.log("Chain ID: %s", block.chainid);
    }

    function hashMessage(MessageStruct memory messageStruct) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            MESSAGE_TYPEHASH,
            keccak256(bytes(messageStruct.text)),
            messageStruct.deadline
        ));
    }

    function verifyMessage(MessageStruct calldata messageStruct, address sender, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(hashMessage(messageStruct));
        address recoveredSigner = ECDSA.recover(digest, v, r, s);

        console.log("Recovered address: %s", recoveredSigner);
        console.log("Sender address: %s", sender);

        return recoveredSigner == sender;
    }

    function message(MessageStruct calldata messageStruct, address sender, uint8 v, bytes32 r, bytes32 s) public {
        require(verifyMessage(messageStruct, sender, v, r, s), "INVALID SIGNATURE");
        require(block.timestamp <= messageStruct.deadline, "DEADLINE HAS BEEN REACHED");

        textMessage = messageStruct.text;
        messageSender = msg.sender;

        emit MessageChanged(textMessage, messageSender);
    }
}