# 2108 - Polkadot Hero App

这是编号2108的完整项目：从零到英雄的Polkadot区块链应用开发。

## 项目概述

本项目展示了完整的Polkadot区块链应用开发流程，包括：
- Substrate区块链节点开发
- 自定义运行时模块（pallet）
- 前端Web应用开发
- 智能合约框架
- 钱包集成
- 部署和文档

## 文件结构

```
2108/
├── node/              # 区块链节点实现
├── pallets/           # 自定义运行时模块
├── runtime/           # 运行时配置
├── frontend/          # 前端用户界面
├── contracts/         # ink! 智能合约
├── scripts/           # 部署和测试脚本
├── docs/              # 项目文档
├── README.md          # 项目说明
└── .git/              # Git仓库
```

## 快速开始

```bash
cd 2108
./scripts/start-all.sh
```

访问 http://localhost:3000 使用应用

## 学习要点

1. **区块链基础** - Substrate框架和Runtime开发
2. **前端集成** - Polkadot.js API和钱包连接
3. **智能合约** - ink!语言和合约部署
4. **全栈开发** - 从前端到区块链的完整流程
5. **部署运维** - 生产环境部署和监控

这个项目体现了从零开始构建完整区块链应用的能力。