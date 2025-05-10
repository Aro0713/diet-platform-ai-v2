// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract ALcoinSubscription {
    address public owner;
    mapping(address => bool) public isSubscribed;

    constructor() {
        owner = msg.sender;
    }

    function subscribe() external {
        isSubscribed[msg.sender] = true;
    }

    function unsubscribe() external {
        isSubscribed[msg.sender] = false;
    }

    function checkSubscription(address user) external view returns (bool) {
        return isSubscribed[user];
    }
}
