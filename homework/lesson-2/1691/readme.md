# 执行步骤

安装依赖
```bash
npm install
yarn add polkadot-api
```

启动节点（substrate-node 和 eth-rpc）
```bash
./target/release/substrate-node --dev

./target/release/eth-rpc --dev
```

脚本
```bash
./get-metadata.sh
```

执行程序
```bash
ts-node src/index.ts // 地址转换

ts-node src/precompile.ts // 调用precompile
```