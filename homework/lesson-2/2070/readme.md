这份作业总结文档是为你量身定制的。它不仅包含了技术实现，还融入了你作为 **Whale3070** 那种“排除错误、直达真理”的独特逻辑思维。

你可以直接将以下内容整理成 Markdown 文件或 PDF 提交给助教。

---

# Lesson 2 作业总结：地址转换与预编译调用验证

**提交人：** Whale3070
**日期：** 2026-01-08
**环境：** Kali Linux / Python 3.13 / Moonbase Alpha Testnet

---

## 1. 核心任务目标

1. **编程实现地址转换**：研究并实现波卡 Substrate 账户（AccountId32）与 EVM 账户（H160）之间的映射逻辑。
2. **测试 Balance 一致性**：验证同一账户在 Substrate RPC 和 Ethereum RPC 视图下的余额是否完全同步。
3. **调用 Precompile**：通过以太坊接口调用波卡底层原生预编译合约。

---

## 2. 逻辑推演与排除法

在实验过程中，我通过“排除法”识破了波卡生态中关于地址的三个“障眼法”：

* **排除迷信封装**：最初尝试使用通用的 `evm:` 前缀进行 32 字节映射，但在 Moonbeam 这种 **Unified Account** 架构中，系统通过报错 `Value should be 20 bytes long` 告知我：在这里，H160 已经直接等同于 AccountId。
* **排除 RPC 路径干扰**：解决了 WSS 连接中的 404 握手错误，确定了官方节点的正确响应逻辑。
* **排除格式歧义**：通过 `Web3.to_checksum_address` 修正了以太坊地址的校验和，确保了在严谨的 `web3.py` 环境下运行成功。

---

## 3. 技术实现 (Python)

```python
# 核心逻辑片段
from substrateinterface import SubstrateInterface
from web3 import Web3

# 1. 初始化两端接口
substrate = SubstrateInterface(url="wss://wss.api.moonbase.moonbeam.network", type_registry_preset='moonbeam')
w3 = Web3(Web3.HTTPProvider("https://rpc.api.moonbase.moonbeam.network"))

# 2. 余额一致性验证
sub_bal = substrate.query("System", "Account", [checksum_addr]).value['data']['free'] / (10**18)
evm_bal = w3.eth.get_balance(checksum_addr) / (10**18)

# 3. Precompile 调用 (Identity Contract)
pre_addr = "0x0000000000000000000000000000000000000004"
result = w3.eth.call({'to': pre_addr, 'data': checksum_addr})

```

---

## 4. 实验结果展示

### 运行回显：

```text
>> 开始 Lesson 2 最终验证 (Checksum 修复版)...
>> 使用规范地址: 0x9Af058fd51F5afa6b7DF5410759cA204164242dc
>> 正在查询 Substrate 余额...
>> 正在查询 EVM 余额...
>> ------------------------------
>> Substrate 余额: 1.1 DEV
>> EVM 余额: 1.1 DEV
>> ------------------------------
>> 正在调用 Precompile (Identity)...
>> ✅ Precompile 成功回显数据: 9af058fd51f5afa6b7df5410759ca204164242dc

🔥🔥🔥🔥🔥 Lesson 2 任务彻底达成！ 🔥🔥🔥🔥🔥

```

---

## 5. 关于 Precompile 的深度理解

在本项目中，我选择了 **Identity Precompile (0x...04)** 进行调用。

* **原理**：它是固化在波卡 Runtime 里的原生 Rust 代码。虽然它在 EVM 视图中表现为一个地址，但它不执行字节码，而是直接通过底层系统指令处理输入。
* **验证意义**：成功的回显（Echo）证明了跨越“以太坊外壳”与“波卡内核”的通信链路完全畅通。

---

## 6. Whale3070 结语：生存力与真理

这次作业不仅是代码的堆砌，更是一次对底层逻辑的“褶式”探险。我领悟到：**地址只是一个标识符，真正不变的是它背后连接的资产账本。** 当我们排除了所有因封装库、版本差异和网络环境带来的错误选项，剩下的那两个 **1.1 DEV** 的对齐，就是 Web3 世界最稳固的真理。

---

**下一步建议：**
你可以把这份文档保存为 `Lesson2_Report_Whale3070.md`。如果你准备好了，我们可以开始预习 **Lesson 3（可能涉及 XCM 跨链或更复杂的预编译逻辑）**。你需要我先帮你整理一份 Lesson 3 的核心知识预判吗？