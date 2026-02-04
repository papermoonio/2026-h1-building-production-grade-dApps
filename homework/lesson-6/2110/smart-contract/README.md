# ERC2110 Smart Contract

这是一个基于 ERC-20 标准的智能合约项目，学号为 2110。

## 项目信息

- **合约名称**: ERC2110FT
- **代币名称**: TestToken
- **代币符号**: TTK
- **初始供应量**: 1000 (实际为 1000 * 10^18)
- **目标网络**: Polkadot Hub Testnet

## 项目结构

```
smart-contract/
├── contracts/
│   └── ERC2110FT.sol          # ERC-20 代币合约
├── ignition/
│   └── modules/
│       └── ERC2110FT.ts       # 部署脚本
├── hardhat.config.ts          # Hardhat 配置
├── package.json               # 项目依赖
├── tsconfig.json              # TypeScript 配置
└── .env                       # 环境变量（私钥）
```

## 安装依赖

```bash
npm install
```

## 配置环境变量

在 `.env` 文件中配置你的私钥：

```
PRIVATE_KEY=0x你的私钥
```

**注意**: 请确保你的账户有足够的测试网代币用于支付 gas 费用。

## 编译合约

```bash
npx hardhat compile
```

## 部署合约

部署到 Polkadot Hub Testnet：

```bash
npx hardhat ignition deploy ignition/modules/ERC2110FT.ts --network polkadotTestNet
```

部署成功后，记录合约地址。

## 验证合约

1. 访问 [Polkadot Hub Testnet 浏览器](https://polkadot.testnet.routescan.io/)
2. 搜索你的合约地址
3. 点击 "Verify & Publish" 或 "Contract" -> "Verify"
4. 填写以下信息：
   - 编译器类型: Solidity (Single file)
   - 编译器版本: v0.8.28
   - 优化: Yes, runs=200
   - 合约源代码: 粘贴 `contracts/ERC2110FT.sol` 的内容
   - 构造函数参数: 
     - _name: "TestToken"
     - _symbol: "TTK"
     - _initialSupply: 1000
5. 提交验证请求
6. 等待验证完成，截图保存

## 合约功能

### 基础功能
- `name()`: 返回代币名称
- `symbol()`: 返回代币符号
- `decimals()`: 返回精度（18）
- `totalSupply()`: 返回总供应量
- `balanceOf(address)`: 查询地址余额

### 转账功能
- `transfer(address to, uint256 amount)`: 转账代币
- `approve(address spender, uint256 amount)`: 授权额度
- `transferFrom(address from, address to, uint256 amount)`: 授权转账
- `allowance(address owner, address spender)`: 查询授权额度

### 铸造功能
- `mint(uint256 amount)`: 铸造新代币

## 网络配置

- **RPC URL**: https://services.polkadothub-rpc.com/testnet
- **Chain ID**: 请查看网络文档
- **区块浏览器**: https://polkadot.testnet.routescan.io/

## 注意事项

1. 部署前确保账户有足够的测试网代币
2. 私钥请妥善保管，不要泄露
3. `.env` 文件已添加到 `.gitignore`，不会被提交到 git
4. 验证时需要准确输入构造函数参数

## 作业提交

完成以下步骤后提交：
1. ✅ 合约已部署到 Polkadot Hub Testnet
2. ✅ 合约已在区块链浏览器上验证
3. ✅ 截图保存验证成功的页面
4. ✅ 记录合约地址

## 合约地址

部署后请在此处记录合约地址：

```
合约地址: [待填写]
部署交易: [待填写]
验证状态: [待验证]
```

## License

MIT
