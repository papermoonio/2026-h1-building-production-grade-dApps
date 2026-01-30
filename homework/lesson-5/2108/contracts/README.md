# Polkadot Hero App - 智能合约

这个目录包含了使用ink!编写的智能合约示例。

## 合约类型

### ERC20 标准代币合约
- 实现标准的ERC20代币功能
- 支持转账、批准、查询余额等操作
- 位于 `erc20/` 目录

### 多签钱包合约
- 实现多重签名钱包功能
- 支持多用户确认交易
- 位于 `multisig/` 目录

## 开发要求

确保已安装 cargo-contract:
```bash
cargo install cargo-contract --force
```

## 编译合约

进入相应的合约目录并运行:
```bash
cargo contract build
```

## 部署合约

使用Polkadot.js Apps或自定义脚本部署到本地节点。