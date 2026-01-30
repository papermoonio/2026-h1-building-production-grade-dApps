#!/bin/bash

# Polkadot Hero App - 一键启动脚本

echo "🚀 启动 Polkadot Hero App..."

# 检查必要工具
echo "🔍 检查环境依赖..."
if ! command -v cargo &> /dev/null; then
    echo "❌ 未找到 cargo，请先安装 Rust"
    exit 1
fi

if ! command -v yarn &> /dev/null && ! command -v npm &> /dev/null; then
    echo "❌ 未找到 yarn 或 npm，请先安装 Node.js"
    exit 1
fi

# 编译区块链节点
echo "🔨 编译区块链节点..."
if [ ! -f "./target/release/node-template" ]; then
    echo "正在编译节点..."
    cargo build --release
    
    if [ $? -ne 0 ]; then
        echo "❌ 节点编译失败"
        exit 1
    fi
else
    echo "✅ 节点已编译"
fi

# 启动区块链节点
echo "⛓️  启动区块链节点..."
./target/release/node-template --dev --tmp > node.log 2>&1 &
NODE_PID=$!

# 等待节点启动
echo "⏳ 等待节点启动..."
sleep 10

# 检查节点是否运行
if ps -p $NODE_PID > /dev/null; then
    echo "✅ 区块链节点已启动 (PID: $NODE_PID)"
else
    echo "❌ 节点启动失败，请检查 node.log"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
fi

# 启动前端
echo "🌐 启动前端应用..."
if command -v yarn &> /dev/null; then
    yarn start > ../frontend.log 2>&1 &
else
    npm start > ../frontend.log 2>&1 &
fi
FRONTEND_PID=$!

cd ..

echo "✅ 前端应用已启动 (PID: $FRONTEND_PID)"

# 显示访问信息
echo ""
echo "🎉 Polkadot Hero App 启动成功！"
echo ""
echo "应用查看地址: http://localhost:3000"
echo "区块链节点: ws://localhost:9944"
echo ""
echo "📊 进程信息:"
echo "  区块链节点 PID: $NODE_PID"
echo "  前端应用 PID: $FRONTEND_PID"
echo ""
echo "📝 日志文件:"
echo "  节点日志: node.log"
echo "  前端日志: frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  kill $NODE_PID $FRONTEND_PID"
echo ""

# 等待用户按键停止
echo "按 Ctrl+C 停止所有服务"
trap "kill $NODE_PID $FRONTEND_PID; exit" INT
while true; do
    sleep 1
done