import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';

class PolkadotHeroApp {
    constructor() {
        this.api = null;
        this.account = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        console.log('Initializing Polkadot Hero App...');
        
        // 初始化API连接
        await this.initApi();
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 更新UI状态
        this.updateConnectionStatus();
    }

    async initApi() {
        try {
            // 连接到本地Substrate节点
            const wsProvider = new WsProvider('ws://127.0.0.1:9944');
            this.api = await ApiPromise.create({ provider: wsProvider });
            
            console.log('Connected to Substrate node');
            this.showStatus('wallet-status', '已连接到区块链网络', 'success');
            
        } catch (error) {
            console.error('Failed to connect to node:', error);
            this.showStatus('wallet-status', '无法连接到区块链节点，请确保节点正在运行', 'error');
        }
    }

    bindEvents() {
        // 钱包连接按钮
        document.getElementById('connect-wallet').addEventListener('click', () => {
            this.connectWallet();
        });

        // 创建资产按钮
        document.getElementById('create-asset').addEventListener('click', () => {
            this.createAsset();
        });

        // 转账按钮
        document.getElementById('transfer-token').addEventListener('click', () => {
            this.transferToken();
        });

        // 查询余额按钮
        document.getElementById('query-balance').addEventListener('click', () => {
            this.queryBalance();
        });

        // 增发代币按钮
        document.getElementById('issue-tokens').addEventListener('click', () => {
            this.issueTokens();
        });
    }

    async connectWallet() {
        if (!this.api) {
            this.showStatus('wallet-status', '请先连接到区块链网络', 'error');
            return;
        }

        try {
            // 启用浏览器扩展
            const extensions = await web3Enable('Polkadot Hero App');
            
            if (extensions.length === 0) {
                this.showStatus('wallet-status', '未找到Polkadot钱包扩展，请安装Polkadot{.js}扩展', 'error');
                return;
            }

            // 获取账户
            const accounts = await web3Accounts();
            
            if (accounts.length === 0) {
                this.showStatus('wallet-status', '钱包中没有账户，请先创建账户', 'error');
                return;
            }

            // 使用第一个账户
            this.account = accounts[0];
            this.isConnected = true;
            
            // 显示账户信息
            document.getElementById('account-address').textContent = this.account.address;
            
            // 获取余额
            await this.getAccountBalance();
            
            // 显示账户信息区域
            document.getElementById('account-info').style.display = 'block';
            
            this.showStatus('wallet-status', `已连接到账户: ${this.account.address.substring(0, 10)}...`, 'success');
            
            // 更新所有按钮状态
            this.updateButtonStates(true);

        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showStatus('wallet-status', '钱包连接失败: ' + error.message, 'error');
        }
    }

    async getAccountBalance() {
        if (!this.account || !this.api) return;

        try {
            const { data: { free } } = await this.api.query.system.account(this.account.address);
            const balance = free.toString() / 1e12; // 转换为DOT单位
            document.getElementById('account-balance').textContent = balance.toFixed(4);
        } catch (error) {
            console.error('Failed to get balance:', error);
        }
    }

    async createAsset() {
        if (!this.isConnected || !this.account) {
            this.showStatus('create-status', '请先连接钱包', 'error');
            return;
        }

        const initialSupply = document.getElementById('initial-supply').value;
        
        if (!initialSupply || initialSupply <= 0) {
            this.showStatus('create-status', '请输入有效的初始供应量', 'error');
            return;
        }

        try {
            this.showStatus('create-status', '正在创建资产...', 'info');
            
            // 调用runtime的create_asset函数
            const unsub = await this.api.tx.templateModule
                .createAsset(initialSupply)
                .signAndSend(this.account.address, ({ status, events }) => {
                    if (status.isInBlock) {
                        console.log(`Transaction included in block ${status.asInBlock}`);
                        
                        events.forEach(({ event: { method, section } }) => {
                            if (section === 'templateModule' && method === 'AssetCreated') {
                                this.showStatus('create-status', '资产创建成功！', 'success');
                                // 清空输入框
                                document.getElementById('initial-supply').value = '';
                            }
                        });
                    } else if (status.isFinalized) {
                        console.log(`Transaction finalized at block ${status.asFinalized}`);
                        unsub();
                    }
                });

        } catch (error) {
            console.error('Create asset failed:', error);
            this.showStatus('create-status', '资产创建失败: ' + error.message, 'error');
        }
    }

    async transferToken() {
        if (!this.isConnected || !this.account) {
            this.showStatus('transfer-status', '请先连接钱包', 'error');
            return;
        }

        const assetId = document.getElementById('asset-id').value;
        const recipient = document.getElementById('recipient').value;
        const amount = document.getElementById('transfer-amount').value;

        if (!assetId || !recipient || !amount) {
            this.showStatus('transfer-status', '请填写所有字段', 'error');
            return;
        }

        if (amount <= 0) {
            this.showStatus('transfer-status', '转账金额必须大于0', 'error');
            return;
        }

        try {
            this.showStatus('transfer-status', '正在执行转账...', 'info');
            
            const unsub = await this.api.tx.templateModule
                .transfer(assetId, recipient, amount)
                .signAndSend(this.account.address, ({ status, events }) => {
                    if (status.isInBlock) {
                        console.log(`Transfer included in block ${status.asInBlock}`);
                        
                        events.forEach(({ event: { method, section } }) => {
                            if (section === 'templateModule' && method === 'Transferred') {
                                this.showStatus('transfer-status', '转账成功！', 'success');
                                // 清空输入框
                                document.getElementById('asset-id').value = '';
                                document.getElementById('recipient').value = '';
                                document.getElementById('transfer-amount').value = '';
                            }
                        });
                    } else if (status.isFinalized) {
                        unsub();
                    }
                });

        } catch (error) {
            console.error('Transfer failed:', error);
            this.showStatus('transfer-status', '转账失败: ' + error.message, 'error');
        }
    }

    async queryBalance() {
        const assetId = document.getElementById('query-asset-id').value;
        const account = document.getElementById('query-account').value || 
                       (this.account ? this.account.address : '');

        if (!assetId) {
            this.showStatus('query-result', '请输入资产ID', 'error');
            return;
        }

        if (!account) {
            this.showStatus('query-result', '请输入账户地址或连接钱包', 'error');
            return;
        }

        try {
            this.showStatus('query-result', '正在查询...', 'info');
            
            // 调用查询函数
            const unsub = await this.api.tx.templateModule
                .getBalance(assetId, account)
                .signAndSend(this.account?.address || account, ({ status }) => {
                    if (status.isInBlock) {
                        this.showStatus('query-result', `查询请求已提交，结果将显示在控制台`, 'success');
                        unsub();
                    }
                });

        } catch (error) {
            console.error('Query failed:', error);
            this.showStatus('query-result', '查询失败: ' + error.message, 'error');
        }
    }

    async issueTokens() {
        if (!this.isConnected || !this.account) {
            this.showStatus('issue-status', '请先连接钱包', 'error');
            return;
        }

        const assetId = document.getElementById('issue-asset-id').value;
        const amount = document.getElementById('issue-amount').value;

        if (!assetId || !amount) {
            this.showStatus('issue-status', '请填写所有字段', 'error');
            return;
        }

        if (amount <= 0) {
            this.showStatus('issue-status', '增发数量必须大于0', 'error');
            return;
        }

        try {
            this.showStatus('issue-status', '正在增发代币...', 'info');
            
            const unsub = await this.api.tx.templateModule
                .issueTokens(assetId, amount)
                .signAndSend(this.account.address, ({ status, events }) => {
                    if (status.isInBlock) {
                        console.log(`Issue included in block ${status.asInBlock}`);
                        
                        events.forEach(({ event: { method, section } }) => {
                            if (section === 'templateModule' && method === 'TokensIssued') {
                                this.showStatus('issue-status', '代币增发成功！', 'success');
                                // 清空输入框
                                document.getElementById('issue-asset-id').value = '';
                                document.getElementById('issue-amount').value = '';
                            }
                        });
                    } else if (status.isFinalized) {
                        unsub();
                    }
                });

        } catch (error) {
            console.error('Issue tokens failed:', error);
            this.showStatus('issue-status', '代币增发失败: ' + error.message, 'error');
        }
    }

    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status ${type}`;
    }

    updateConnectionStatus() {
        const connectButton = document.getElementById('connect-wallet');
        connectButton.disabled = !this.api;
        connectButton.textContent = this.api ? '连接钱包' : '等待节点连接...';
    }

    updateButtonStates(isConnected) {
        const buttons = ['create-asset', 'transfer-token', 'issue-tokens'];
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = !isConnected;
            }
        });
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.polkadotApp = new PolkadotHeroApp();
});