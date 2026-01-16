import sys
from substrateinterface import SubstrateInterface
from web3 import Web3

def log(msg):
    print(f">> {msg}")
    sys.stdout.flush()

# --- 官方 RPC ---
RPC_SUBSTRATE = "wss://wss.api.moonbase.moonbeam.network"
RPC_EVM = "https://rpc.api.moonbase.moonbeam.network"

# 原始地址
RAW_ADDR = "0x9Af058fd51F5afa6b7DF5410759cA204164242dc"
#0x1234567890abcdef1234567890abcdef12345678"

def final_lesson_2_success():
    log("开始 Lesson 2 最终验证 (Checksum 修复版)...")
    
    try:
        # 1. 将地址转换为 Web3 要求的 Checksum 格式
        # 这一步会将 0x123... 转换成 0x1234567890AbcdEF... 这种大小写混搭格式
        checksum_addr = Web3.to_checksum_address(RAW_ADDR)
        log(f"使用规范地址: {checksum_addr}")

        # 2. 初始化 Substrate (针对 Moonbeam 的 20 字节配置)
        substrate = SubstrateInterface(url=RPC_SUBSTRATE, type_registry_preset='moonbeam')
        
        # 3. 查询 Substrate 余额
        log(f"正在查询 Substrate 余额...")
        sub_account = substrate.query("System", "Account", [checksum_addr])
        sub_bal = sub_account.value['data']['free'] / (10**18)
        
        # 4. 查询 EVM 余额
        log("正在查询 EVM 余额...")
        w3 = Web3(Web3.HTTPProvider(RPC_EVM))
        evm_bal = w3.eth.get_balance(checksum_addr) / (10**18)
        
        log("-" * 30)
        log(f"Substrate 余额: {sub_bal} DEV")
        log(f"EVM 余额: {evm_bal} DEV")
        log("-" * 30)
        
        # 5. 调用 Precompile (Identity)
        log("正在调用 Precompile (Identity)...")
        pre_addr = "0x0000000000000000000000000000000000000004"
        # 模拟调用：传入地址，预期返回一样的地址
        result = w3.eth.call({'to': pre_addr, 'data': checksum_addr})
        log(f"✅ Precompile 成功回显数据: {result.hex()}")

        print("\n" + "🔥"*5 + " Lesson 2 任务彻底达成！ " + "🔥"*5)

    except Exception as e:
        log(f"❌ 运行出错: {e}")

if __name__ == "__main__":
    final_lesson_2_success()
