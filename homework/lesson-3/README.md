# Homework 3
- 在本地环境测试uniswap V2，运行测试用例，提交测试报告

- 实现一个miniSwap，包含addLiquidity, removeLiquidity, swap三个接口。
 以下是miniSwap的实现要求：
  1. 包含一个UI界面，可以进行addLiquidity, removeLiquidity, swap操作。
  2. 可以连接Metamask钱包
  3. 可以部署到Polkadot Test Hub或者本地
  
  以下是miniSwap的简化实现：
  1. 所有的Token之间兑换比例为1:1
  2. 没有手续费
  3. 没有对Liquidity的奖励
  4. 交易的Token的ERC20合约，可以手工部署，然后配置到前端界面

- 源代码提交到 https://github.com/papermoonio/2026-h1-building-production-grade-dApps/tree/main/homework/lesson-3 

- 加分项目：基于miniSwap的实现，增加任何uniswap中包含的功能，比如增加手续费，增加对Liquidity的奖励，增加交易对的数量，增加交易对的类型等。UI界面做相应的变化。