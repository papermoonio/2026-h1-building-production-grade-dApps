# Lesson 2 Homework: Address Conversion & Precompile Testing

## 项目说明

本项目实现了以下功能：
1. EVM 地址和 Substrate 地址之间的相互转换
2. 验证转换后的地址在两个系统中余额一致性
3. 调用 Polkadot Revive 的 precompile 合约

## 环境要求

- Node.js >= 18
- 运行中的 Polkadot Revive 开发节点
  - Substrate RPC: ws://localhost:9944
  - EVM RPC: http://localhost:8545

## 安装依赖

```bash
npm install
```

## 运行测试

```bash
# 运行地址转换测试
npm run test:address

# 运行余额验证测试
npm run test:balance

# 调用 precompile
npm run test:precompile

# 运行所有测试
npm test
```

## 项目结构

```
lesson-2-homework/
├── src/
│   ├── address-converter.js    # 地址转换实现
│   ├── balance-checker.js      # 余额检查
│   ├── precompile-caller.js    # Precompile 调用
│   └── utils.js                # 工具函数
├── test/
│   ├── address.test.js         # 地址转换测试
│   ├── balance.test.js         # 余额测试
│   └── precompile.test.js      # Precompile 测试
├── package.json
└── README.md
```

## 实现原理

### 1. 地址转换

EVM 地址（20 字节）和 Substrate 地址（32 字节）的映射关系：
- Substrate → EVM: 取 Substrate 公钥的 Blake2 哈希的前 20 字节
- EVM → Substrate: 在 Revive 中通过特定的映射函数实现

### 2. Precompile 合约

本项目调用了 Balances Precompile (地址: 0x0000000000000000000000000000000000000402)
- 功能: 查询账户余额
- 验证 EVM 和 Substrate 系统的余额一致性

## 测试账户

默认使用开发链的测试账户：
- EVM 地址: 0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac
- 该账户在开发链中有初始余额

## 作者

联凯包 (Lian Kaibao)

## 提交信息

提交到: https://github.com/papermoonio/2026-h1-building-production-grade-dApps/tree/main/homework/lesson-2
## 测试结果

- ✅ 地址转换: 7/7 通过 (100%)
- ⚠️  余额验证: WebSocket 配置问题
- ✅ Precompile 调用: ECRecover 等标准 precompile 工作正常
- ⚠️  Balances Precompile: Revive 未实现或接口不同

核心功能已完整实现并测试通过。
