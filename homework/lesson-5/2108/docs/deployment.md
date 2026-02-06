# 部署指南

## 本地开发环境部署

### 1. 启动区块链节点

```bash
# 编译节点（如果尚未编译）
cargo build --release

# 启动开发网络
./target/release/node-template --dev --tmp
```

节点将在以下端口运行：
- RPC: http://localhost:9933
- WebSocket: ws://localhost:9944
- P2P: 30333

### 2. 启动前端应用

```bash
cd frontend
yarn install
yarn start
```

前端应用将在 http://localhost:3000 运行

### 3. 配置钱包

1. 安装 [Polkadot{.js} Extension](https://polkadot.js.org/extension/)
2. 导入Alice账户（开发环境预设账户）
3. 连接到本地网络

## 生产环境部署

### 1. 编译优化版本

```bash
# 编译优化的节点二进制文件
cargo build --release --features fast-runtime
```

### 2. 配置链规格

编辑 `node/src/chain_spec.rs` 配置生产环境参数：

```rust
pub fn production_config() -> Result<ChainSpec, String> {
    let wasm_binary = WASM_BINARY.ok_or_else(|| "Production wasm not available".to_string())?;
    
    Ok(ChainSpec::from_genesis(
        "Polkadot Hero Mainnet",
        "polkadot_hero_mainnet",
        ChainType::Live,
        move || {
            // 配置生产环境创世块
            production_genesis(
                wasm_binary,
                // 配置验证人节点
                vec![
                    // 添加验证人公钥
                ],
                // 配置治理账户
                get_account_id_from_seed::<sr25519::Public>("Governance"),
                // 初始资金分配
                vec![
                    // 配置初始账户和余额
                ],
                false,
            )
        },
        // 配置引导节点
        vec![
            "/dns/bootnode1.polkadot-hero.com/tcp/30333/p2p/12D3KooW...",
        ],
        // 遥测配置
        Some(
            TelemetryEndpoints::new(vec![(STAGING_TELEMETRY_URL.to_string(), 0)])
                .map_err(|_| "Invalid telemetry endpoint".to_string())?,
        ),
        // 协议ID
        Some("polkadot-hero"),
        // 属性配置
        Some(chain_properties()),
        // 扩展配置
        Default::default(),
    ))
}
```

### 3. 部署验证人节点

```bash
# 启动验证人节点
./target/release/node-template \
  --chain production \
  --name "Validator Node 1" \
  --validator \
  --rpc-cors all \
  --unsafe-rpc-external \
  --rpc-methods Unsafe
```

### 4. 监控和维护

推荐使用以下监控工具：

- **Prometheus**: 收集节点指标
- **Grafana**: 可视化监控面板
- **Logstash/Elasticsearch**: 日志收集和分析

## 智能合约部署

### 1. 编译合约

```bash
cd contracts/erc20
cargo contract build
```

### 2. 部署到链上

使用Polkadot.js Apps:

1. 访问 https://polkadot.js.org/apps/
2. 连接到你的节点
3. 导航到 "Developer" → "Contracts"
4. 上传 `.contract` 文件
5. 调用构造函数部署合约

或者使用CLI工具：

```bash
# 安装合约CLI
npm install -g @openzeppelin/upgrades-cli

# 部署合约
oz deploy --network polkadot-hero
```

## 网络升级

### Runtime升级流程

1. **准备升级**
   ```bash
   # 编译新的runtime
   cd runtime
   cargo build --release
   ```

2. **生成升级提案**
   ```bash
   # 使用sudo权限提交升级
   # 或通过治理流程提交
   ```

3. **执行升级**
   ```bash
   # 等待提案通过投票
   # 执行runtime升级
   ```

### 零停机升级

使用Substrate的forkless upgrade特性，可以在不中断网络的情况下升级runtime。

## 安全考虑

### 关键安全措施

1. **密钥管理**
   - 使用硬件安全模块(HSM)
   - 实施多重签名策略
   - 定期轮换密钥

2. **网络安全**
   - 配置防火墙规则
   - 启用SSL/TLS加密
   - 限制RPC访问

3. **监控告警**
   - 设置异常交易监控
   - 配置性能阈值告警
   - 实施DDoS防护

### 应急响应

建立完善的应急响应流程：

1. **检测阶段**: 实时监控系统状态
2. **评估阶段**: 分析问题影响范围
3. **响应阶段**: 执行预定义的恢复计划
4. **恢复阶段**: 验证系统正常运行
5. **总结阶段**: 文档化事件和改进措施