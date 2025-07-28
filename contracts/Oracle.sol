// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

error NotAuthorized();

contract Oracle {
    uint256 private data;
    uint256 private lastUpdated;
    address public oracleUpdater;
    
    event DataUpdated(uint256 indexed value, uint256 timestamp);
    
    constructor() {
        oracleUpdater = msg.sender;
    }
    
    modifier onlyOracle() {
        if(msg.sender != oracleUpdater) revert NotAuthorized();
        _;
    }
    
    function updateData(uint256 value) external onlyOracle {
        data = value;
        lastUpdated = block.timestamp;
        emit DataUpdated(value, block.timestamp);
    }
    
    function getData() external view returns (uint256 value, uint256 timestamp) {
        return (data, lastUpdated);
    }
}