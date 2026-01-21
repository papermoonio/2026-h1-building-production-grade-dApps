// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title UpgradeableCounterV1
 * @notice 一个简单的可升级计数器合约 - V1版本
 * @dev 使用 UUPS (Universal Upgradeable Proxy Standard) 代理模式
 */
contract UpgradeableCounterV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @notice 合约版本号 - 升级后会变化
    uint256 public version;

    /// @notice 计数器值 - 升级后保持不变
    uint256 public count;

    /// @notice 合约名称 - 升级后保持不变
    string public name;

    /// @notice 最后更新时间 - 升级后保持不变
    uint256 public lastUpdated;

    /// @notice 初始化函数 (替代构造函数)
    /// @param _name 合约名称
    function initialize(string memory _name) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        version = 1;
        count = 0;
        name = _name;
        lastUpdated = block.timestamp;
    }

    /// @notice 增加计数器
    /// @param _value 增加的值
    function increment(uint256 _value) public {
        count += _value;
        lastUpdated = block.timestamp;
    }

    /// @notice 减少计数器
    /// @param _value 减少的值
    function decrement(uint256 _value) public {
        require(count >= _value, "Counter: underflow");
        count -= _value;
        lastUpdated = block.timestamp;
    }

    /// @notice 获取合约信息
    /// @return _version 版本号
    /// @return _count 当前计数
    /// @return _name 合约名称
    /// @return _lastUpdated 最后更新时间
    function getInfo() external view returns (
        uint256 _version,
        uint256 _count,
        string memory _name,
        uint256 _lastUpdated
    ) {
        return (version, count, name, lastUpdated);
    }

    /// @notice UUPS 升级授权函数 - 只有 owner 可以升级
    /// @param newImplementation 新的实现合约地址
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
