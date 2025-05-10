import { useState } from 'react'
import { JsonRpcProvider, Wallet, Contract } from 'ethers'

const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const CONTRACT_ABI = [
  "function subscribe() external",
  "function isSubscribed(address) view returns (bool)"
]

// Prywatny klucz z konta testowego Hardhat (Account #0)
const PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce03804f3ede5e5bb7caa66'

export default function Subscription() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [status, setStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const provider = new JsonRpcProvider('http://127.0.0.1:9545')

  // Uproszczone typowanie – TypeScript nie narzeka
  const contract: any = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  const checkStatus = async () => {
    if (!walletAddress) return
    try {
      setLoading(true)
      const result = await contract.isSubscribed(walletAddress)
      setStatus(result)
    } catch (err) {
      console.error('Błąd sprawdzania subskrypcji:', err)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const subscribeOnChain = async () => {
    try {
      setLoading(true)
      const wallet = new Wallet(PRIVATE_KEY, provider)
      const signerContract: any = contract.connect(wallet)
      const tx = await signerContract.subscribe()
      await tx.wait()
      setStatus(true)
    } catch (err) {
      console.error('Błąd aktywacji subskrypcji:', err)
    } finally {
      setLoading(false)
    }
  }

  const simulatePaymentAndSubscribe = async () => {
    alert('🔔 Symulacja: płatność kartą zaakceptowana')
    await subscribeOnChain()
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <h1 className='text-3xl font-bold mb-6'>Panel Subskrypcyjny</h1>

      <input
        type='text'
        placeholder='Wklej adres portfela...'
        className='w-full max-w-lg border px-4 py-2 mb-4'
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />

      <div className='space-x-4 mb-4'>
        <button
          onClick={checkStatus}
          disabled={loading || !walletAddress}
          className='bg-blue-600 text-white px-4 py-2 rounded'
        >
          Sprawdź status
        </button>

        <button
          onClick={subscribeOnChain}
          disabled={loading || !walletAddress}
          className='bg-green-600 text-white px-4 py-2 rounded'
        >
          Aktywuj blockchainem
        </button>

        <button
          onClick={simulatePaymentAndSubscribe}
          disabled={loading || !walletAddress}
          className='bg-purple-600 text-white px-4 py-2 rounded'
        >
          Opłać kartą (symulacja)
        </button>
      </div>

      {typeof status === 'boolean' && (
        <p className='mt-4 text-lg'>
          Status: {status ? '✅ Aktywna subskrypcja' : '❌ Brak subskrypcji'}
        </p>
      )}
    </div>
  )
}
