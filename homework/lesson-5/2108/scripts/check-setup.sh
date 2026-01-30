#!/bin/bash

# Polkadot Hero App - 测试脚本

cd "$(dirname "$0")/.."

echo "🚀 开始测试 Polkadot Hero App..."

# 检查必要的工具
echo "🔍 检查开发环境..."
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust 未安装"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo 未安装"
    exit 1
fi

echo "✅ Rust 版本: $(rustc --version)"
echo "✅ Cargo 版本: $(cargo --version)"

# 检查项目结构
echo "📁 检查项目结构..."
REQUIRED_DIRS=("node" "pallets" "runtime" "frontend" "contracts" "scripts" "docs")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ 缺少目录: $dir"
        exit 1
    fi
    echo "✅ 目录存在: $dir"
done

# 检查关键文件
echo "📄 检查关键文件..."
REQUIRED_FILES=(
    "Cargo.toml"
    "pallets/template/Cargo.toml"
    "pallets/template/src/lib.rs"
    "runtime/Cargo.toml"
    "runtime/src/lib.rs"
    "node/Cargo.toml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少文件: $file"
        exit 1
    fi
    echo "✅ 文件存在: $file"
done

echo "🎉 项目结构检查完成！"
echo "下一步: 运行 'cargo build --release' 编译项目"