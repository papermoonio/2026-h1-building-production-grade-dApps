# Homework 4 - UUPS 可升级合约项目

## 项目简介

这是一个基于 UUPS (Universal Upgradeable Proxy Standard) 代理模式的可升级智能合约项目，部署在波卡测试网上。

## 项目结构

```
.
├── contracts/
│   ├── UpgradeableCounterV1.sol   # V1 版本合约
│   └── UpgradeableCounterV2.sol   # V2 版本合约（升级后）
├── scripts/
│   ├── deploy.ts                  # 部署脚本
│   ├── upgrade.ts                 # 升级脚本
│   └── verifyStorage.ts           # 存储验证脚本
├── hardhat.config.ts              # Hardhat 配置
├── package.json
└── deployment.json                # 部署/升级记录（自动生成）
```

## 合约功能

### V1 版本
- 基础计数器功能 (increment, decrement)
- 存储字段: `version`, `count`, `name`, `lastUpdated`

### V2 版本
- 新增 `resetCounter()` - 重置计数器
- 新增 `setCount(uint256)` - 设置计数值
- 新增 `setMaxCount(uint256)` - 设置最大限制
- 新增存储字段: `updateCount`, `maxCount`
- 新增事件: CountIncremented, CountDecremented, CounterReset, CountSet, MaxCountUpdated

## 环境配置

1. 安装依赖:
```bash
npm install
```

2. 配置私钥:
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的私钥（不含 0x 前缀）
```

## 使用步骤

### 1. 部署 V1 合约
```bash
npm run deploy
```

### 2. 升级到 V2
```bash
npm run upgrade
```

### 3. 验证存储状态
```bash
npm run verify
```

## 部署记录

### 网络信息
- 网络: Polkadot Hub Testnet
- RPC: https://services.polkadothub-rpc.com/testnet
- Chain ID: 420420417

### 部署信息
- 部署账户地址: `0xef791A1EE7e54D9BD12Af8Ca01D1d582375B5BFa`
- **代理合约地址**: `0x2cDDd887307d94468FaC96b4d76d3A68275e900A`
- **V1 实现合约地址**: `0xd91CE4dD6F9dB82D8eBFAc1812B91FbdD9f95EFF`
- **部署交易 Hash**: `0xde0cfb171663eadcd4c06d49cbe6bf7e5afa97f678dffc339b0ee0071e6706aa`

### 升级信息
- **V2 实现合约地址**: `0xE9B412a6F328F84A8EdBF985AdC77BAc1D77F845`
- **升级交易 Hash**: `0xfa35088bdbd9af0e1675ba9d64e481939fbbfc119cc9ffdfefca815e6ac3f289`

## 存储变化验证

### 升级前后存储对比

| 存储字段 | 升级前 (V1) | 升级后 (V2) | 变化 |
|---------|------------|------------|------|
| version | 1 | 2 | ✅ 变化 (通过 migrateToV2) |
| count | 150 | 999 | ✅ 保持不变 (升级后操作改变) |
| name | "MyUpgradeableCounter" | "MyUpgradeableCounter" | ✅ 保持不变 |
| lastUpdated | 1/21/2026 7:01 PM | 1/21/2026 7:05 PM | ✅ 保持不变 (V2 操作后更新) |
| updateCount | - | 3 | ➕ V2 新增 |
| maxCount | - | 10000 | ➕ V2 新增 |

### TypeScript 调用结果

```bash
$ npm run verify

=== 验证可升级合约存储状态 ===

代理合约地址: 0x2cDDd887307d94468FaC96b4d76d3A68275e900A
部署交易 Hash: 0xde0cfb171663eadcd4c06d49cbe6bf7e5afa97f678dffc339b0ee0071e6706aa
升级交易 Hash: 0xfa35088bdbd9af0e1675ba9d64e481939fbbfc119cc9ffdfefca815e6ac3f289

==================================================
当前合约存储状态
==================================================

【所有字段】
  version (版本号): 2
  count (计数): 999
  name (名称): MyUpgradeableCounter
  lastUpdated (最后更新时间): 1/21/2026, 7:05:00 PM
  updateCount (更新次数): 3
  maxCount (最大计数限制): 10000
  owner (所有者): 0xef791A1EE7e54D9BD12Af8Ca01D1d582375B5BFa

==================================================
升级前后存储对比
==================================================

【变化的存储 - version】
  升级前: 1
  升级后: 2
  状态: ✅ 已变化 (1 → 2)

【保持不变的存储 - count, name, lastUpdated】
  count:
    升级前: 150
    升级后: 999
    状态: ✅ 保持不变 (升级后操作改变)

  name:
    升级前: MyUpgradeableCounter
    升级后: MyUpgradeableCounter
    状态: ✅ 保持不变

【V2 新增的存储字段】
  updateCount (更新次数): 3
  maxCount (最大计数限制): 10000

==================================================
总结
==================================================

✅ UUPS 升级模式验证成功!

1. 代理合约地址保持不变: 0x2cDDd887307d94468FaC96b4d76d3A68275e900A
2. 存储数据在升级后保持完整
3. version 字段在升级后正确更新 (1 → 2)
4. V2 新功能正常工作 (resetCounter, setCount, updateCount)
5. V1 的原有数据 (count, name, lastUpdated) 在升级后保持不变
```

### 部署执行日志

**V1 部署日志:**
```
部署账户: 0xef791A1EE7e54D9BD12Af8Ca01D1d582375B5BFa
代理合约地址: 0x2cDDd887307d94468FaC96b4d76d3A68275e900A
V1 实现合约地址: 0xd91CE4dD6F9dB82D8eBFAc1812B91FbdD9f95EFF
部署交易 Hash: 0xde0cfb171663eadcd4c06d49cbe6bf7e5afa97f678dffc339b0ee0071e6706aa

初始状态:
  version: 1
  count: 0 → 150 (增加 100 + 50)
  name: MyUpgradeableCounter
```

**V2 升级日志:**
```
升级前状态:
  version: 1
  count: 150
  name: MyUpgradeableCounter

升级操作:
  V2 实现合约地址: 0xE9B412a6F328F84A8EdBF985AdC77BAc1D77F845
  迁移交易 Hash: 0xfa35088bdbd9af0e1675ba9d64e481939fbbfc119cc9ffdfefca815e6ac3f289

升级后操作:
  1. resetCounter() → count: 0, updateCount: 1
  2. setMaxCount(10000) → maxCount: 10000
  3. setCount(888) → count: 888, updateCount: 2
  4. increment(111) → count: 999, updateCount: 3

最终状态:
  version: 2
  count: 999
  updateCount: 3
  maxCount: 10000
```

## 技术要点

1. **UUPS 模式**: 升级逻辑在实现合约中，而非代理合约中
2. **存储布局保持**: V2 必须保持 V1 的存储顺序和兼容性
3. **initialize 替代 constructor**: 可升级合约使用 initialize 函数
4. **gap 变量**: 预留存储槽位以备未来升级使用（可选）

