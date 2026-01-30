#!/bin/bash

# Polkadot Hero App - 实时状态监控

echo "🔄 Polkadot Hero App 实时状态监控"
echo "==================================="

while true; do
    clear
    echo "⏰ $(date)"
    echo "==================================="
    
    # 检查编译状态
    echo "🔧 编译状态:"
    if [ -f "/Users/test/lingma/lesson5/target/release/node-template" ]; then
        echo "   ✅ 区块链节点编译完成"
        NODE_STATUS="运行中"
    else
        echo "   ⏳ 区块链节点编译中..."
        NODE_STATUS="编译中"
    fi
    
    # 检查前端状态
    echo "🌐 前端状态:"
    if pgrep -f "serve.*49707" > /dev/null; then
        echo "   ✅ 前端服务运行中 (端口 49707)"
        FRONTEND_STATUS="运行中"
    else
        echo "   ❌ 前端服务未运行"
        FRONTEND_STATUS="停止"
    fi
    
    # 检查进程
    echo "📊 进程监控:"
    echo "   区块链节点: $NODE_STATUS"
    echo "   前端服务: $FRONTEND_STATUS"
    
    # 显示访问信息
    echo ""
    echo "🔗 访问地址:"
    if [ "$FRONTEND_STATUS" = "运行中" ]; then
        echo "   🌐 前端界面: http://localhost:49707"
    fi
    if [ "$NODE_STATUS" = "运行中" ]; then
        echo "   ⛓️  区块链节点: ws://localhost:9944"
    fi
    
    # 显示磁盘使用
    echo ""
    echo "💾 存储使用:"
    PROJECT_SIZE=$(du -sh /Users/test/lingma/lesson5 2>/dev/null | cut -f1)
    echo "   项目大小: ${PROJECT_SIZE:-计算中}"
    
    echo ""
    echo "按 Ctrl+C 停止监控"
    sleep 5
done