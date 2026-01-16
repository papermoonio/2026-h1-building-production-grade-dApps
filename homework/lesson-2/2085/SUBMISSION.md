# Lesson 2 作业提交说明

## 作业完成内容

本作业实现了以下三个主要功能：

### 1. 地址转换 (Address Conversion)
- **文件**: `src/address-converter.js`
- **功能**:
  - EVM 地址 (20 字节) ↔ Substrate 地址 (32 字节) 相互转换
  - Substrate → EVM: 使用 Blake2-256 哈希取前 20 字节
  - EVM → Substrate: 扩展到 32 字节并进行 SS58 编码
  - 地址格式验证
  - 地址字节表示获取

### 2. 余额一致性验证 (Balance Verification)
- **文件**: `src/balance-checker.js`
- **功能**:
  - 同时连接 Substrate RPC (ws://localhost:9944) 和 EVM RPC (http://localhost:8545)
  - 查询同一账户在两个系统中的余额
  - 验证余额一致性
  - 支持批量查询
  - 余额格式化显示

### 3. Precompile 合约调用 (Precompile Calls)
- **文件**: `src/precompile-caller.js`
- **功能**:
  - 调用 Balances Precompile (0x0000000000000000000000000000000000000402)
  - 通过 precompile 查询账户余额
  - 验证 precompile 返回值与直接查询的一致性
  - 支持批量查询
  - 性能测试

## 测试覆盖

### 地址转换测试 (`test/address.test.js`)
- ✅ EVM 地址格式验证
- ✅ Substrate 地址格式验证
- ✅ Substrate → EVM 转换
- ✅ EVM → Substrate 转换
- ✅ 往返转换测试
- ✅ 地址字节表示
- ✅ 批量转换

### 余额验证测试 (`test/balance.test.js`)
- ✅ EVM 余额查询
- ✅ Substrate 余额查询
- ✅ 余额一致性比较 (从 EVM 地址开始)
- ✅ 余额一致性比较 (从 Substrate 地址开始)
- ✅ 批量余额检查
- ✅ 余额一致性验证

### Precompile 测试 (`test/precompile.test.js`)
- ✅ 列出支持的 Precompiles
- ✅ 调用 Balances Precompile
- ✅ 验证 Precompile 准确性
- ✅ 批量 Precompile 查询
- ✅ ECRecover Precompile 测试
- ✅ Precompile 可访问性检查
- ✅ 性能测试

## 运行方法

### 前置条件
```bash
# 1. 安装依赖
npm install

# 2. 确保 Polkadot Revive 节点正在运行
# - Substrate RPC: ws://localhost:9944
# - EVM RPC: http://localhost:8545
```

### 运行测试
```bash
# 运行所有测试
npm test

# 或单独运行各个测试
npm run test:address      # 地址转换测试
npm run test:balance      # 余额验证测试
npm run test:precompile   # Precompile 测试
```

## 技术要点

### 1. 地址映射原理
```javascript
// Substrate → EVM
const publicKey = decodeAddress(substrateAddress);  // 32 字节
const hash = blake2AsHex(publicKey, 256);           // Blake2-256 哈希
const evmAddress = hash.slice(2, 42);               // 取前 20 字节
```

### 2. 双系统余额查询
```javascript
// Substrate 系统
const balance = await api.query.system.account(address);

// EVM 系统  
const balance = await provider.getBalance(address);
```

### 3. Precompile 调用
```javascript
// 创建合约实例
const contract = new ethers.Contract(
  PRECOMPILE_ADDRESS,
  ABI,
  provider
);

// 调用方法
const balance = await contract.balanceOf(address);
```

## 实验结果

通过本作业的实现和测试，验证了以下关键点：

1. **地址转换正确性**: EVM 和 Substrate 地址可以正确相互转换
2. **余额一致性**: 同一账户在两个系统中的余额完全一致
3. **Precompile 功能性**: Balances Precompile 可以正确查询余额
4. **系统互操作性**: EVM 工具可以无缝访问 Substrate 链的状态

## 项目结构
```
lesson-2-homework/
├── src/
│   ├── address-converter.js    # 地址转换实现
│   ├── balance-checker.js      # 余额检查实现
│   ├── precompile-caller.js    # Precompile 调用实现
│   └── utils.js                # 工具函数
├── test/
│   ├── address.test.js         # 地址转换测试
│   ├── balance.test.js         # 余额测试
│   ├── precompile.test.js      # Precompile 测试
│   └── run-all-tests.js        # 测试运行器
├── package.json
├── README.md
├── SUBMISSION.md               # 本文件
└── .gitignore
```

## 提交信息

- **学生**: 联凯包 (Lian Kaibao)
- **课程**: Building Production-Grade dApps
- **作业**: Lesson 2 - Address Conversion & Precompile Testing
- **提交时间**: 2026-01-08
- **GitHub**: https://github.com/papermoonio/2026-h1-building-production-grade-dApps/tree/main/homework/lesson-2

## 依赖包版本

```json
{
  "@polkadot/api": "^12.0.2",
  "@polkadot/util": "^12.6.2",
  "@polkadot/util-crypto": "^12.6.2",
  "ethers": "^6.10.0"
}
```

## 注意事项

1. 本项目需要运行中的 Polkadot Revive 开发节点
2. 地址转换基于标准的加密算法实现
3. 余额查询需要节点完全同步
4. 测试使用的是开发链账户，实际生产环境需要使用真实账户
5. Precompile 地址根据 Polkadot Revive 的实现可能有所不同

## 扩展功能建议

1. 增加更多 precompile 的测试覆盖
2. 实现账户余额变化的监听功能
3. 增加交易发送后的余额验证
4. 实现地址簿管理功能
5. 添加 Web UI 界面

## 学习收获

通过本次作业，深入理解了：
- Polkadot Revive 的双层架构设计
- EVM 和 Substrate 地址系统的映射机制
- Precompile 合约的工作原理
- 跨系统状态一致性的保证机制
