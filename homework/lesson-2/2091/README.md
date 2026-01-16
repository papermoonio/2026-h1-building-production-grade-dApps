# Lesson 2 作业 - 地址转换和 Precompile 调用

> 学号：2091  
> 作业提交日期：2026-01-08

## 📋 作业要求

1. ✅ 编程实现地址的转换，并测试 balance 是否一致
2. ✅ 选择一个 precompile 来调用


## 🚀 快速开始

### 环境要求

- Node.js >= 20.x
- npm 或 yarn
- 已编译的 Polkadot SDK 本地节点

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地节点

在两个终端中分别运行：

**终端 1 - Substrate 节点:**
```bash
./target/release/substrate-node --dev
```

**终端 2 - ETH RPC:**
```bash
./target/release/eth-rpc --dev
```

### 3. 生成元数据

确保节点运行后，执行：
```bash
# Windows PowerShell
npx papi add devnet -w ws://localhost:9944

# 或者使用 bash (Git Bash / WSL)
bash get-metadata.sh
```

这会创建 `.papi/descriptors` 目录并生成类型定义。

### 4. 重新安装依赖（重要！）

生成 descriptors 后需要重新安装：
```bash
npm install

### 5. 运行程序

```bash
# 地址转换和余额查询
npm start

# 调用 precompile
npm run precompile
```

---

## 📁 项目结构

```
2091/
├── src/
│   ├── accounts.ts      # 账户管理和地址转换
│   ├── utils.ts         # 工具函数（Provider、API）
│   ├── index.ts         # 主程序（地址转换测试）
│   └── precompile.ts    # Precompile 调用示例
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
├── get-metadata.sh      # 元数据生成脚本
├── .gitignore          # Git 忽略文件
└── README.md           # 本文档
```

---

## 💡 核心实现说明

### 地址转换算法

#### 1. Substrate AccountId32 → EVM H160

---

## 🐛 遇到的问题及解决方案

### 问题 1: Module '@polkadot-api/descriptors' has no exported member 'devnet'

**原因**: 还没有生成 descriptors 文件

**解决方案**:
1. 确保本地节点正在运行 (ws://localhost:9944)
2. 运行 `npx papi add devnet -w ws://localhost:9944`
3. 运行 `npm install` 重新安装依赖
4. 检查是否生成了 `.papi/descriptors` 目录

### 问题 2: Node.js 版本过低导致语法错误

**现象**: `SyntaxError: Invalid regular expression flags`

**原因**: Node.js v18 不支持某些 ES2024 特性

**解决方案**: 升级到 Node.js 20.x 或更高版本

### 问题 3: Missing WebSocket class

**原因**: Node.js 环境缺少 WebSocket 实现

**解决方案**:
1. 安装 `ws` 包: `npm install ws`
2. 使用 `polkadot-api/ws-provider/node` 而不是默认的 provider

### 问题 4: TypeScript 无法识别 .ts 文件

**原因**: 缺少 `tsconfig.json` 配置

**解决方案**: 创建 `tsconfig.json` 并配置 CommonJS 模块系统


