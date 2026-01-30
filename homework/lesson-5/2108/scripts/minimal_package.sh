#!/bin/bash

# 2108项目极简打包脚本
# 只保留绝对必要的核心源代码文件

SOURCE_DIR="/Users/test/lingma/2108"
TARGET_DIR="/Users/test/lingma/2108_minimal"

echo "🎯 创建2108项目极简版..."

# 创建目标目录
mkdir -p $TARGET_DIR

# 只复制最关键的核心文件
echo "📋 复制核心源代码..."

# 1. 项目根目录配置
cp $SOURCE_DIR/Cargo.toml $TARGET_DIR/

# 2. 最核心的Rust代码
cp $SOURCE_DIR/pallets/template/src/lib.rs $TARGET_DIR/template_pallet.rs
cp $SOURCE_DIR/runtime/src/lib.rs $TARGET_DIR/runtime.rs

# 3. 前端核心代码
cp $SOURCE_DIR/frontend/src/index.js $TARGET_DIR/frontend.js
cp $SOURCE_DIR/frontend/index.html $TARGET_DIR/index.html

# 4. 关键文档
cp $SOURCE_DIR/README.md $TARGET_DIR/
cp $SOURCE_DIR/TEST_REPORT.md $TARGET_DIR/SUMMARY.md

# 创建超简版README
cat > $TARGET_DIR/README_MINIMAL.md << 'EOF'
# 2108 - Polkadot区块链项目 (极简版)

## 项目说明
这是一个完整的Polkadot区块链应用核心代码，展示了：
- 自定义代币管理系统
- 区块链运行时逻辑
- 前端交互界面

## 核心文件说明
- `Cargo.toml` - 项目配置
- `template_pallet.rs` - 区块链核心逻辑
- `runtime.rs` - 运行时配置
- `frontend.js` - 前端交互代码
- `index.html` - 界面模板

## 运行环境
- Rust 1.66+
- Node.js 16+

## 快速验证
可以直接查看源代码了解实现逻辑
EOF

# 创建文件说明
cat > $TARGET_DIR/FILES_INFO.txt << EOF
2108项目极简版文件清单:

核心源代码:
1. Cargo.toml - 项目配置文件
2. template_pallet.rs - 代币管理逻辑
3. runtime.rs - 区块链运行时
4. frontend.js - 前端交互代码
5. index.html - 界面模板
6. README.md - 项目说明
7. SUMMARY.md - 测试总结
8. README_MINIMAL.md - 本说明文件

总计: 8个核心文件
EOF

echo "✅ 极简版创建完成！"
echo "📁 位置: $TARGET_DIR"
echo "📊 文件统计: $(find $TARGET_DIR -type f | wc -l) 个文件"
echo "💾 总大小: $(du -sh $TARGET_DIR | cut -f1)"