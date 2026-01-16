import { ethers } from 'ethers';

/**
 * Precompile 调用器类
 * 调用 Polkadot Revive 的预编译合约
 */
class PrecompileCaller {
  constructor(rpcUrl = 'http://localhost:8545') {
    this.rpcUrl = rpcUrl;
    this.provider = null;
    
    // Balances Precompile 地址和 ABI
    // 地址: 0x0000000000000000000000000000000000000402
    this.BALANCES_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000402';
    
    // Balances Precompile ABI
    // 提供了查询账户余额的功能
    this.BALANCES_ABI = [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  /**
   * 连接到 EVM 节点
   */
  async connect() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to EVM node (Chain ID: ${network.chainId})`);
    } catch (error) {
      throw new Error(`Failed to connect to EVM node: ${error.message}`);
    }
  }

  /**
   * 通过 Balances Precompile 查询账户余额
   * @param {string} accountAddress - 要查询的账户地址
   * @returns {Object} 余额信息
   */
  async getBalanceViaPrecompile(accountAddress) {
    try {
      // 创建 precompile 合约实例
      const balancesContract = new ethers.Contract(
        this.BALANCES_PRECOMPILE_ADDRESS,
        this.BALANCES_ABI,
        this.provider
      );

      // 调用 balanceOf 方法
      const balance = await balancesContract.balanceOf(accountAddress);

      return {
        address: accountAddress,
        balance: balance.toString(),
        balanceFormatted: ethers.formatEther(balance),
        precompileAddress: this.BALANCES_PRECOMPILE_ADDRESS
      };
    } catch (error) {
      throw new Error(`Failed to call Balances precompile: ${error.message}`);
    }
  }

  /**
   * 批量查询多个账户余额
   * @param {string[]} addresses - 地址数组
   * @returns {Array} 每个地址的余额信息
   */
  async batchGetBalances(addresses) {
    const results = [];

    for (const address of addresses) {
      try {
        const result = await this.getBalanceViaPrecompile(address);
        results.push({
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          success: false,
          address,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 验证 precompile 返回的余额与直接查询的余额是否一致
   * @param {string} accountAddress - 账户地址
   * @returns {Object} 比较结果
   */
  async verifyPrecompileBalance(accountAddress) {
    try {
      // 通过 precompile 获取余额
      const precompileResult = await this.getBalanceViaPrecompile(accountAddress);
      
      // 直接通过 provider 获取余额
      const directBalance = await this.provider.getBalance(accountAddress);

      const isEqual = BigInt(precompileResult.balance) === directBalance;

      return {
        address: accountAddress,
        precompileBalance: precompileResult.balance,
        directBalance: directBalance.toString(),
        precompileBalanceFormatted: precompileResult.balanceFormatted,
        directBalanceFormatted: ethers.formatEther(directBalance),
        isEqual,
        difference: (BigInt(precompileResult.balance) - directBalance).toString()
      };
    } catch (error) {
      throw new Error(`Failed to verify precompile balance: ${error.message}`);
    }
  }

  /**
   * 测试其他 precompile (示例: ECRecover)
   * ECRecover precompile 地址: 0x0000000000000000000000000000000000000001
   */
  async testECRecoverPrecompile() {
    const ECRECOVER_ADDRESS = '0x0000000000000000000000000000000000000001';
    
    try {
      // ECRecover 示例数据
      const messageHash = '0x' + '00'.repeat(32);
      const v = 27;
      const r = '0x' + '01'.repeat(32);
      const s = '0x' + '02'.repeat(32);

      // 构造调用数据
      const data = ethers.concat([
        messageHash,
        ethers.zeroPadValue(ethers.toBeHex(v), 32),
        r,
        s
      ]);

      // 调用 precompile
      const result = await this.provider.call({
        to: ECRECOVER_ADDRESS,
        data: data
      });

      return {
        precompileAddress: ECRECOVER_ADDRESS,
        inputData: data,
        result: result,
        success: true
      };
    } catch (error) {
      return {
        precompileAddress: ECRECOVER_ADDRESS,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取所有支持的 precompile 信息
   * @returns {Array} Precompile 列表
   */
  getSupportedPrecompiles() {
    return [
      {
        name: 'ECRecover',
        address: '0x0000000000000000000000000000000000000001',
        description: 'Recovers the address associated with the public key from an ECDSA signature'
      },
      {
        name: 'SHA256',
        address: '0x0000000000000000000000000000000000000002',
        description: 'Computes the SHA-256 hash'
      },
      {
        name: 'RIPEMD160',
        address: '0x0000000000000000000000000000000000000003',
        description: 'Computes the RIPEMD-160 hash'
      },
      {
        name: 'Identity',
        address: '0x0000000000000000000000000000000000000004',
        description: 'Returns the input data unchanged'
      },
      {
        name: 'Modexp',
        address: '0x0000000000000000000000000000000000000005',
        description: 'Arbitrary-precision exponentiation under modulo'
      },
      {
        name: 'Balances',
        address: this.BALANCES_PRECOMPILE_ADDRESS,
        description: 'Query and manage account balances (Polkadot Revive specific)'
      }
    ];
  }
}

export default PrecompileCaller;
