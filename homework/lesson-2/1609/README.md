# Lesson 2 Assignment - Address Conversion & Precompile Testing

## 目标 (Objectives)

本作业要求完成以下两个主要任务：
1. **编程实现地址的转换**，并测试balance是否一致
2. **选择一个precompile来调用**

## 文件说明 (File Description)

### 核心文件

#### 1. `accounts.ts` - 地址转换模块
实现SS58和H160地址格式的互相转换：

- `convertPublicKeyToSs58(publickey)` - 将公钥转换为SS58地址
- `h160ToAccountId32(address)` - 将H160地址转换为AccountId32
  - H160地址作为前20字节
  - 后12字节填充0xEE（表示eth-derived）
- `accountId32ToH160(accountId)` - 将AccountId32转换为H160地址
  - 如果是eth-derived（后12字节全为0xEE），直接取前20字节
  - 否则使用keccak256哈希取后20字节

#### 2. `utils.ts` - 工具模块
提供与链交互的基础功能：

- `getProvider(isLocal)` - 获取在JSON RPC提供者
- `getApi(isLocal)` - 获取Polkadot API客户端
- `setBalance(ss58Address, balance)` - 使用sudo设置账户余额

#### 3. `precompile.ts` - Precompile调用模块
实现对链上precompile的调用：

- `callIdentity()` - 调用Identity Precompile（地址0x0000...0004）
  - 回显输入数据
- `callHash()` - 调用Hash Precompile（地址0x0000...0002）
  - 计算输入数据的哈希
- `callECMul()` - 调用EC Multiply Precompile（地址0x0000...0003）
  - 椭圆曲线乘法运算

#### 4. `index.ts` - 主测试套件
包含三个主要测试：

**Test 1: Alice地址转换**
- 获取Alice的SS58和H160地址
- 验证两种格式间的地址转换一致性
- 对比两种格式的余额

**Test 2: 随机账户设置余额**
- 生成随机Substrate密钥对
- 转换为SS58和H160地址
- 使用sudo设置余额为100 ETH
- 验证两种格式的余额一致性

**Test 3: EVM派生账户**
- 使用ethers.js生成随机钱包
- 转换为SS58地址
- 验证不同格式地址的余额一致

然后调用所有precompile进行测试

## 地址转换原理 (Address Conversion Logic)

### H160 → AccountId32
```
H160（20字节） + 0xEE × 12字节 = AccountId32（32字节）
```

### AccountId32 → H160

**Eth-derived情况**（后12字节为0xEE）：
```
取前20字节作为H160地址
```

**非eth-derived情况**：
```
Keccak256(AccountId32) → 取后20字节作为H160地址
```

### SS58 ↔ 公钥
```
SS58 ←→ 公钥（使用Prefix 42用于Substrate/Polkadot）
```

## 运行方式 (How to Run)

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 运行测试
```bash
npm run dev
# 或直接使用tsx
npx tsx index.ts
```

### 编译
```bash
npm run build
```

## 测试结果预期 (Expected Output)

程序会输出：
1. Alice账户的SS58和H160地址及余额
2. 地址转换的验证（是否成功往返转换）
3. 随机生成账户的创建、余额设置和验证
4. EVM派生账户的前述测试
5. 各Precompile的调用结果

## 依赖 (Dependencies)

- **ethers.js**: EVM交互
- **@polkadot-api**: Polkadot区块链交互
- **@polkadot-labs/hdkd**: 分层确定性密钥衍生
- **TypeScript**: 类型安全的JavaScript

## 提交内容 (Submission Content)

需要提交以下文件到课程仓库：
- `accounts.ts` - 地址转换实现
- `utils.ts` - 工具函数
- `precompile.ts` - Precompile调用实现  
- `index.ts` - 主测试套件
- `package.json` - 项目配置
- `tsconfig.json` - TypeScript配置
- `README.md` - 本说明文档
