import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { ERC2110FT_ADDRESS, ERC2110FT_ABI, RPC } from '../constants'

interface TokenProps {
  provider: ethers.BrowserProvider
  account: string
  canSendTx?: boolean
}

export const Token = ({ provider, account, canSendTx = false }: TokenProps) => {
  const [name, setName] = useState<string | null>(null)
  const [symbol, setSymbol] = useState<string | null>(null)
  const [decimals, setDecimals] = useState<number | null>(null)
  const [totalSupply, setTotalSupply] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [status, setStatus] = useState('')

  const readProvider = new ethers.JsonRpcProvider(RPC)

  const loadMetadata = async () => {
    try {
      const token = new ethers.Contract(ERC2110FT_ADDRESS, ERC2110FT_ABI, readProvider as any)
      const [n, s, d, ts] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ])
      setName(n)
      setSymbol(s)
      setDecimals(Number(d))
      // format totalSupply using decimals
      const formatted = ethers.formatUnits(ts, Number(d))
      setTotalSupply(formatted)
    } catch (e) {
      console.warn('Failed to load token metadata', e)
      setName(null)
      setSymbol(null)
      setDecimals(null)
      setTotalSupply(null)
    }
  }

  const loadBalance = async () => {
    if (!account) {
      setBalance(null)
      return
    }
    try {
      const token = new ethers.Contract(ERC2110FT_ADDRESS, ERC2110FT_ABI, readProvider as any)
      const bal = await token.balanceOf(account)
      const dec = await token.decimals()
      const formatted = Number(ethers.formatUnits(bal, Number(dec)))
      setBalance(`${formatted.toFixed(6)} ${await token.symbol()}`)
    } catch (e) {
      console.warn('Failed to load balance', e)
      setBalance(null)
    }
  }

  useEffect(() => { void loadMetadata(); void loadBalance(); }, [account])

  const doTransfer = async () => {
    setStatus('Preparing transfer...')
    try {
      if (!canSendTx) return setStatus('Connected wallet cannot send transactions')
      if (!transferTo) return setStatus('Recipient address required')
      if (!transferAmount) return setStatus('Amount required')

      const signer = await provider.getSigner()
      const signerAddr = await signer.getAddress()
      if (!signerAddr) return setStatus('No signer available')

      const token = new ethers.Contract(ERC2110FT_ADDRESS, ERC2110FT_ABI, signer as any)
      const dec = decimals ?? 18
      const amountWei = ethers.parseUnits(transferAmount, dec)
      const tx = await token.transfer(transferTo, amountWei)
      setStatus(`Sent transfer tx ${tx.hash}, waiting...`)
      await tx.wait()
      setStatus('Transfer confirmed')
      await loadBalance()
      await loadMetadata()
    } catch (e: any) {
      console.error(e)
      setStatus(e?.message || String(e))
    }
  }

  const doMint = async () => {
    setStatus('Preparing mint...')
    try {
      if (!canSendTx) return setStatus('Connected wallet cannot send transactions')
      if (!mintAmount) return setStatus('Mint amount required')
      // mint expects an integer amount (contract multiplies by 10**18 internally)
      const amt = BigInt(mintAmount)
      const signer = await provider.getSigner()
      const token = new ethers.Contract(ERC2110FT_ADDRESS, ERC2110FT_ABI, signer as any)
      const tx = await token.mint(amt)
      setStatus(`Sent mint tx ${tx.hash}, waiting...`)
      await tx.wait()
      setStatus('Mint confirmed')
      await loadBalance()
      await loadMetadata()
    } catch (e: any) {
      console.error(e)
      setStatus(e?.message || String(e))
    }
  }

  return (
    <div className="card">
      <h2>Token</h2>
      <div className="meta">
        <div>Name: {name ?? '—'}</div>
        <div>Symbol: {symbol ?? '—'}</div>
        <div>Decimals: {decimals ?? '—'}</div>
        <div>Total Supply: {totalSupply ?? '—'}</div>
        <div>Balance: {balance ?? '—'}</div>
      </div>

      <div className="input-group">
        <label>Transfer</label>
        <input placeholder="0x..." value={transferTo} onChange={(e) => setTransferTo(e.target.value)} />
        <input placeholder="amount" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
        <button onClick={doTransfer}>Transfer</button>
      </div>

      <div className="input-group">
        <label>Mint (integer tokens)</label>
        <input placeholder="100" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} />
        <button onClick={doMint}>Mint</button>
      </div>

      {status && <p className="status-msg">{status}</p>}
    </div>
  )
}

export default Token
