# 快速开始指南

## 🚀 5分钟快速上手

### 第一步：克隆并安装

```bash
# 进入项目目录
cd lesson-2-homework

# 安装依赖
npm install
```

### 第二步：启动节点

确保你的 Polkadot Revive 节点正在运行：

```bash
# 终端 1: 启动 revive-dev-node
./target/release/revive-dev-node --dev --rpc-external --rpc-cors all --rpc-methods unsafe

# 终端 2: 启动 eth-rpc
./target/release/eth-rpc --dev --rpc-port 8545 --rpc-external --rpc-cors all
```

验证节点运行：
```bash
# 测试 EVM RPC
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 应该返回类似: {"jsonrpc":"2.0","id":1,"result":"0x0"}
```

### 第三步：运行测试

```bash
# 运行所有测试（推荐）
npm test

# 或者分别运行
npm run test:address      # 地址转换 (不需要节点)
npm run test:balance      # 余额验证 (需要节点)
npm run test:precompile   # Precompile (需要节点)
```

## 📋 预期输出

### 地址转换测试
```
================= Address Conversion Tests =================

📝 Test 1: EVM Address Validation
✅ PASSED: EVM Address Validation

📝 Test 2: Substrate Address Validation
✅ PASSED: Substrate Address Validation

... (更多测试)

=================== Test Report ===================
Total tests: 7
Passed: 7
Failed: 0
Pass rate: 100.00%
```

### 余额验证测试
```
============= Balance Verification Tests ==============

🔌 Connecting to nodes...
✅ Connected to Substrate node
✅ Connected to EVM node

📝 Test 1: Get EVM Balance
   Address: 0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac
   Balance: 402823669000000000000000000 wei
   Formatted: 402823669.000000 ETH
✅ PASSED: Get EVM Balance

... (更多测试)
```

### Precompile 测试
```
============= Precompile Contract Tests ==============

🔌 Connecting to EVM node...
✅ Connected to EVM node (Chain ID: 420420420)

📝 Test 1: List Supported Precompiles
   📋 Available Precompiles:
   1. ECRecover
      Address: 0x0000000000000000000000000000000000000001
   2. Balances
      Address: 0x0000000000000000000000000000000000000402
✅ PASSED: List Precompiles

... (更多测试)
```

## 🐛 故障排除

### 问题 1: 连接失败
```
❌ Failed to connect to nodes
```
**解决方案**: 
- 确认节点正在运行
- 检查端口 9944 (Substrate) 和 8545 (EVM) 是否开放
- 运行 `curl` 命令验证连接

### 问题 2: 数据库错误
```
Failed to process block: SqlxError(Database(SqliteError { code: 1, message: "no such table: transaction_hashes" }))
```
**解决方案**:
```bash
# 停止节点
pkill -f revive-dev-node
pkill -f eth-rpc

# 清理数据
rm -rf /tmp/revive-node*

# 重新启动节点
```

### 问题 3: 余额为零
```
Balance: 0 wei
```
**解决方案**:
- 确保使用的是开发链预设账户
- 或使用水龙头为测试账户充值

## 📚 代码示例

### 使用地址转换
```javascript
import AddressConverter from './src/address-converter.js';

// EVM → Substrate
const evmAddr = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
const subAddr = AddressConverter.evmToSubstrate(evmAddr);
console.log(subAddr); // 5...

// Substrate → EVM
const evmAddr2 = AddressConverter.substrateToEvm(subAddr);
console.log(evmAddr2); // 0x...
```

### 查询余额
```javascript
import BalanceChecker from './src/balance-checker.js';

const checker = new BalanceChecker();
await checker.connect();

const result = await checker.compareBalances('0xf24ff3a9...');
console.log(result.evmBalance);
console.log(result.substrateBalance);
console.log(result.isEqual); // true

await checker.disconnect();
```

### 调用 Precompile
```javascript
import PrecompileCaller from './src/precompile-caller.js';

const caller = new PrecompileCaller();
await caller.connect();

const balance = await caller.getBalanceViaPrecompile('0xf24ff3a9...');
console.log(balance.balanceFormatted); // "402823669.000000"
```

## 🎯 下一步

1. 修改测试用例使用你自己的账户地址
2. 尝试发送交易后验证余额变化
3. 探索其他 precompile 合约
4. 实现一个简单的 DApp 使用这些工具

## 📞 获取帮助

如果遇到问题：
1. 查看详细的 README.md
2. 检查 SUBMISSION.md 中的技术细节
3. 在 GitHub 提交 issue

## ✅ 验证清单

- [ ] npm install 成功
- [ ] 节点正常运行
- [ ] curl 测试通过
- [ ] 地址转换测试通过
- [ ] 余额验证测试通过  
- [ ] Precompile 测试通过
- [ ] 所有测试 100% 通过

完成以上步骤，你的作业就完成了！🎉
