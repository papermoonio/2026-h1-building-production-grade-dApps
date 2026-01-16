# 1 安装三种不同的钱包，创建测试账户
- 安装钱包：metamask，subwallte，tailsman wallte

# 2 本地编译Polkadot SDK，启动节点和RPC服务
- 编译：
	- cargo build --release -p pallet-revive-eth-rpc
	- cargo build --release --bin substrate-node
- 启动
	- target/release/substrate-node --dev --tmp
	- target/release/eth-rpc

# 3 https://faucet.polkadot.io/?parachain=1111 得到测试token

# 4 获取余额
	- npm init -y
	- npm install ethers
	- npm install -D typescript ts-node @types/node
	- src/index.ts
		- 修改testnet rpc：https://testnet-passet-hub-eth-rpc.polkadot.io
		- 修改钱包地址：0xfeb5dda8bbd9746b0b59b0b84964af37e9172a8c
	- npx ts-node src/index.ts

