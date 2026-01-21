// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title UpgradeableCounterV2
 * @notice 可升级计数器合约 - V2版本
 * @dev 新增功能：重置计数器、设置计数器值、获取历史更新次数
 */
contract UpgradeableCounterV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @notice 合约版本号 - 升级后会变为 2
    uint256 public version;

    /// @notice 计数器值 - 升级后保持不变
    uint256 public count;

    /// @notice 合约名称 - 升级后保持不变
    string public name;

    /// @notice 最后更新时间 - 升级后保持不变
    uint256 public lastUpdated;

    /// @notice V2 新增: 历史更新次数
    uint256 public updateCount;

    /// @notice V2 新增: 最大计数器值限制
    uint256 public maxCount;

    /// @notice 初始化函数
    /// @param _name 合约名称
    function initialize(string memory _name) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        version = 2;
        count = 0;
        name = _name;
        lastUpdated = block.timestamp;
        updateCount = 0;
        maxCount = type(uint256).max;
    }

    /// @notice 增加计数器
    /// @param _value 增加的值
    function increment(uint256 _value) public {
        count += _value;
        lastUpdated = block.timestamp;
        updateCount++;
        _emitIncrementEvent(_value);
    }

    /// @notice 减少计数器
    /// @param _value 减少的值
    function decrement(uint256 _value) public {
        require(count >= _value, "Counter: underflow");
        count -= _value;
        lastUpdated = block.timestamp;
        updateCount++;
        _emitDecrementEvent(_value);
    }

    /// @notice V2 新增: 重置计数器
    function resetCounter() public {
        count = 0;
        lastUpdated = block.timestamp;
        updateCount++;
        emit CounterReset(msg.sender, block.timestamp);
    }

    /// @notice V2 新增: 设置计数器值
    /// @param _value 新的计数器值
    function setCount(uint256 _value) public {
        require(_value <= maxCount, "Counter: exceeds max count");
        count = _value;
        lastUpdated = block.timestamp;
        updateCount++;
        emit CountSet(msg.sender, _value, block.timestamp);
    }

    /// @notice V2 新增: 设置最大计数限制
    /// @param _maxCount 最大值
    function setMaxCount(uint256 _maxCount) public onlyOwner {
        maxCount = _maxCount;
        emit MaxCountUpdated(_maxCount);
    }

    /// @notice V2 新增: 迁移到 V2 版本（更新版本号）
    /// 升级后需要调用此函数来更新 version
    function migrateToV2() public onlyOwner {
        version = 2;
        emit VersionMigrated(2);
    }

    /// @notice 获取合约信息 (V2 扩展)
    /// @return _version 版本号
    /// @return _count 当前计数
    /// @return _name 合约名称
    /// @return _lastUpdated 最后更新时间
    /// @return _updateCount 历史更新次数
    /// @return _maxCount 最大计数限制
    function getInfo() external view returns (
        uint256 _version,
        uint256 _count,
        string memory _name,
        uint256 _lastUpdated,
        uint256 _updateCount,
        uint256 _maxCount
    ) {
        return (version, count, name, lastUpdated, updateCount, maxCount);
    }

    /// @notice V2 新增: 获取扩展信息
    /// @return contractVersion 版本号
    /// @return currentCount 当前计数
    /// @return contractName 合约名称
    /// @return timestamp 最后更新时间
    /// @return totalUpdates 历史更新次数
    /// @return maximumCount 最大计数限制
    /// @return contractOwner 合约所有者
    function getExtendedInfo() external view returns (
        uint256 contractVersion,
        uint256 currentCount,
        string memory contractName,
        uint256 timestamp,
        uint256 totalUpdates,
        uint256 maximumCount,
        address contractOwner
    ) {
        return (version, count, name, lastUpdated, updateCount, maxCount, owner());
    }

    /// @notice 内部函数: 发送增量事件
    function _emitIncrementEvent(uint256 _value) internal {
        emit CountIncremented(msg.sender, _value, count);
    }

    /// @notice 内部函数: 发送减量事件
    function _emitDecrementEvent(uint256 _value) internal {
        emit CountDecremented(msg.sender, _value, count);
    }

    /// @notice UUPS 升级授权函数
    /// @param newImplementation 新的实现合约地址
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ========== Events ==========

    /// @notice V2 新增事件
    event CountIncremented(address indexed caller, uint256 value, uint256 newCount);
    event CountDecremented(address indexed caller, uint256 value, uint256 newCount);
    event CounterReset(address indexed caller, uint256 timestamp);
    event CountSet(address indexed caller, uint256 newValue, uint256 timestamp);
    event MaxCountUpdated(uint256 newMaxCount);
    event VersionMigrated(uint256 newVersion);
}
