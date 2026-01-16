# Moonbeam 地址转换与 Precompile 调用示例

本项目演示了在 Moonbeam/Moonbase Alpha 网络上：
1. Substrate SS58 地址与 EVM H160 地址之间的转换
2. 通过 Precompile 和直接 RPC 查询验证余额一致性
3. 调用 Native ERC-20 Precompile 和 Batch Precompile

## 项目结构

```
2083/
├── package.json
├── README.md
└── src/
    ├── addressConverter.js    # 地址转换工具
    ├── balanceCheck.js        # 余额一致性检查
    ├── precompileCall.js      # Precompile调用示例
    └── test.js                # 综合测试脚本
```

## 安装依赖

```bash
npm install
```

## 使用方法

### 1. 地址转换

```bash
npm run convert
```

演示 EVM H160 地址与 Substrate SS58 地址之间的转换。

### 2. 余额检查

```bash
npm run balance
```

通过 Substrate RPC 和 EVM RPC 分别查询同一账户的余额，验证一致性。

### 3. Precompile 调用

```bash
npm run precompile
```

调用 Moonbeam 的预编译合约：
- **Native ERC-20 Precompile (0x802)**: 查询原生代币信息和余额
- **Batch Precompile (0x808)**: 演示批量交易编码

### 4. 运行测试

```bash
npm test
```

运行完整的测试套件，包括：
- 地址转换功能测试
- 余额一致性测试
- Precompile 调用测试

## 地址转换原理

### EVM → Substrate (Moonbeam 映射规则)

```javascript
// 使用 "evm:" 前缀 + H160 地址进行 Blake2 哈希
const prefix = "evm:";
const data = prefix + evmAddress (不带0x);
const accountId = blake2_256(data);
const ss58Address = encodeAddress(accountId, ss58Format);
```

### Substrate → EVM

```javascript
// 取 SS58 地址解码后公钥的前 20 字节
const publicKey = decodeAddress(ss58Address);
const evmAddress = "0x" + publicKey.slice(0, 20).toHex();
```

**注意**: 这两种转换不是互逆的！

## Precompile 地址

| 名称 | 地址 | 用途 |
|------|------|------|
| Parachain Staking | 0x800 | 质押相关操作 |
| Native ERC-20 | 0x802 | 原生代币 ERC-20 接口 |
| Batch | 0x808 | 批量交易 |
| Call Permit | 0x80a | 无 Gas 签名调用 |

## 网络配置

默认使用 **Moonbase Alpha** 测试网：
- WebSocket: `wss://wss.api.moonbase.moonbeam.network`
- HTTP RPC: `https://rpc.api.moonbase.moonbeam.network`
- Chain ID: 1287
- SS58 Format: 1287

## 依赖

- `@polkadot/api` - Substrate API
- `@polkadot/util-crypto` - 加密工具
- `ethers` - EVM 交互
- `web3` - Web3 库

## 作者

2083 - Polkadot SDK 课程作业

## 许可证

MIT
