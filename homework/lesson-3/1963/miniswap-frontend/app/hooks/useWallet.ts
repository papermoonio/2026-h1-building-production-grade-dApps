"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NETWORK_CONFIG } from "../config";

export interface WalletState {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  chainId: number | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    provider: null,
    signer: null,
    isConnected: false,
    chainId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaMaskProvider, setMetaMaskProvider] = useState<any>(null);

  // Check if wallet is already connected
  useEffect(() => {
    // Find and store MetaMask provider on mount
    const provider = getMetaMaskProvider();
    if (provider) {
      setMetaMaskProvider(provider);
    }
    
    // Debug: Log all available providers (safely)
    if (typeof window !== 'undefined') {
      try {
        const win = window as any;
        console.log('=== Wallet Detection Debug ===');
        
        // Safely check if ethereum exists
        if (win.ethereum !== undefined) {
          // Check if it's an array
          const isArray = Array.isArray(win.ethereum);
          console.log('Is array?', isArray);
          
          if (isArray) {
            // Safely map over array
            try {
              const walletInfo = win.ethereum.map((p: any, i: number) => {
                try {
                  return {
                    index: i,
                    isMetaMask: p?.isMetaMask ?? false,
                    isOKExWallet: p?.isOKExWallet ?? false,
                    isOKEx: p?.isOKEx ?? false,
                    constructor: p?.constructor?.name ?? 'Unknown'
                  };
                } catch {
                  return { index: i, error: 'Could not access wallet properties' };
                }
              });
              console.log('Available wallets:', walletInfo);
            } catch (err) {
              console.log('Could not enumerate wallets array:', err);
            }
          } else if (win.ethereum) {
            // Safely access single provider properties
            try {
              const providerInfo = {
                isMetaMask: win.ethereum.isMetaMask ?? false,
                isOKExWallet: win.ethereum.isOKExWallet ?? false,
                isOKEx: win.ethereum.isOKEx ?? false,
                constructor: win.ethereum.constructor?.name ?? 'Unknown'
              };
              console.log('Single provider:', providerInfo);
            } catch (err) {
              console.log('Could not access provider properties:', err);
            }
          }
        } else {
          console.log('window.ethereum is undefined');
        }
        
        console.log('MetaMask provider found:', provider ? 'YES' : 'NO');
        console.log('============================');
      } catch (err) {
        console.error('Error in wallet detection debug:', err);
      }
    }
    checkConnection();
  }, []);

  // Helper function to safely get property from wallet object
  function safeGetProperty(obj: any, prop: string): any {
    try {
      return obj?.[prop];
    } catch {
      return undefined;
    }
  }

  // Helper function to get MetaMask provider specifically - ONLY MetaMask
  function getMetaMaskProvider() {
    if (typeof window === 'undefined') return null;
    
    try {
      const win = window as any;
      
      // Strategy 1: Check if ethereum is an array (multiple wallets installed)
      if (Array.isArray(win.ethereum)) {
        console.log('Multiple wallets detected, searching for MetaMask...');
        try {
          const metaMaskProvider = win.ethereum.find((p: any) => {
            try {
              return p && safeGetProperty(p, 'isMetaMask') === true;
            } catch {
              return false;
            }
          });
          if (metaMaskProvider) {
            console.log('✅ Found MetaMask in array');
            return metaMaskProvider;
          } else {
            // Safely log available wallets
            try {
              const walletInfo = win.ethereum.map((p: any) => {
                try {
                  return {
                    isMetaMask: safeGetProperty(p, 'isMetaMask') ?? false,
                    isOKExWallet: safeGetProperty(p, 'isOKExWallet') ?? false,
                    isCoinbaseWallet: safeGetProperty(p, 'isCoinbaseWallet') ?? false
                  };
                } catch {
                  return { error: 'Could not access' };
                }
              });
              console.log('❌ MetaMask not found in array. Available wallets:', walletInfo);
            } catch (err) {
              console.log('❌ MetaMask not found in array');
            }
          }
        } catch (err) {
          console.error('Error searching wallets array:', err);
        }
      }
      
      // Strategy 2: Check if current ethereum is MetaMask
      if (win.ethereum) {
        try {
          // Safely check if it's OKX or other wallet, reject it
          const isOKX = (safeGetProperty(win.ethereum, 'isOKExWallet') === true) || 
                        (safeGetProperty(win.ethereum, 'isOKEx') === true);
          if (isOKX) {
            console.log('❌ OKX wallet detected, rejecting...');
            // Try to find MetaMask in providers if available
            try {
              const providers = safeGetProperty(win.ethereum, 'providers');
              if (providers && Array.isArray(providers)) {
                const metaMaskProvider = providers.find((p: any) => {
                  try {
                    return p && safeGetProperty(p, 'isMetaMask') === true;
                  } catch {
                    return false;
                  }
                });
                if (metaMaskProvider) {
                  console.log('✅ Found MetaMask in OKX providers array');
                  return metaMaskProvider;
                }
              }
            } catch (err) {
              console.error('Error checking OKX providers:', err);
            }
            return null; // Reject OKX
          }
          
          // If it's MetaMask, use it
          if (safeGetProperty(win.ethereum, 'isMetaMask') === true) {
            console.log('✅ Found MetaMask directly');
            return win.ethereum;
          }
        } catch (err) {
          console.error('Error checking ethereum provider:', err);
        }
      }
      
      // Strategy 3: Check providers array (some wallets wrap providers)
      try {
        const providers = safeGetProperty(win.ethereum, 'providers');
        if (providers && Array.isArray(providers)) {
          const metaMaskProvider = providers.find((p: any) => {
            try {
              return p && safeGetProperty(p, 'isMetaMask') === true;
            } catch {
              return false;
            }
          });
          if (metaMaskProvider) {
            console.log('✅ Found MetaMask in providers array');
            return metaMaskProvider;
          }
        }
      } catch (err) {
        console.error('Error checking providers array:', err);
      }
      
      console.log('❌ MetaMask not found');
      return null;
    } catch (err) {
      console.error('Error in getMetaMaskProvider:', err);
      return null;
    }
  }

  async function checkConnection() {
    try {
      // Use stored MetaMask provider or find it
      let provider = metaMaskProvider || getMetaMaskProvider();
      
      if (!provider) {
        setError("MetaMask not detected. Please install MetaMask extension.");
        setIsLoading(false);
        return;
      }

      // Double-check it's actually MetaMask
      const providerCheck = provider as any;
      if (providerCheck.isMetaMask !== true) {
        console.error('Provider verification failed:', {
          isMetaMask: providerCheck.isMetaMask,
          isOKExWallet: providerCheck.isOKExWallet
        });
        setError("MetaMask not found. Please ensure MetaMask is installed and enabled.");
        setIsLoading(false);
        return;
      }

      // Store the provider for future use
      if (!metaMaskProvider) {
        setMetaMaskProvider(provider);
      }

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const accounts = await ethersProvider.listAccounts();
      
      if (accounts.length > 0) {
        // Always get a fresh signer to ensure it matches the current account
        const signer = await ethersProvider.getSigner();
        const signerAddress = await signer.getAddress();
        const network = await ethersProvider.getNetwork();
        
        // Verify signer address matches the first account
        if (signerAddress.toLowerCase() !== accounts[0].address.toLowerCase()) {
          console.warn('⚠️ Signer address mismatch, refreshing signer...');
          // Get signer again - sometimes need to refresh
          const refreshedSigner = await ethersProvider.getSigner();
          const refreshedAddress = await refreshedSigner.getAddress();
          
          if (refreshedAddress.toLowerCase() !== accounts[0].address.toLowerCase()) {
            console.error('❌ Signer still mismatched after refresh');
            setError("Account mismatch detected. Please reconnect your wallet.");
            setIsLoading(false);
            return;
          }
          
          setWallet({
            account: accounts[0].address,
            provider: ethersProvider,
            signer: refreshedSigner,
            isConnected: true,
            chainId: Number(network.chainId),
          });
        } else {
          setWallet({
            account: accounts[0].address,
            provider: ethersProvider,
            signer,
            isConnected: true,
            chainId: Number(network.chainId),
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function connect() {
    try {
      setError(null);
      setIsLoading(true);

      // Use stored MetaMask provider or find it fresh
      let provider = metaMaskProvider || getMetaMaskProvider();
      
      if (!provider) {
        throw new Error("MetaMask not detected. Please install MetaMask extension from https://metamask.io and disable other wallet extensions.");
      }

      // Store it for future use
      if (!metaMaskProvider) {
        setMetaMaskProvider(provider);
      }

      // Strictly verify it's actually MetaMask
      const ethereum = provider as any;
      
      // CRITICAL: Verify it's MetaMask, not OKX or other wallets
      if (ethereum.isMetaMask !== true) {
        console.error('❌ Provider is not MetaMask:', {
          isMetaMask: ethereum.isMetaMask,
          isOKExWallet: ethereum.isOKExWallet,
          isOKEx: ethereum.isOKEx,
          constructor: ethereum.constructor?.name
        });
        throw new Error("MetaMask wallet required. Detected wallet is not MetaMask. Please disable OKX and other wallet extensions.");
      }
      
      // Additional explicit checks: Reject known non-MetaMask wallets
      if (ethereum.isOKExWallet === true || ethereum.isOKEx === true) {
        console.error('❌ OKX wallet detected!');
        throw new Error("OKX wallet detected. Please disable OKX extension and use MetaMask only.");
      }
      
      if (ethereum.isCoinbaseWallet === true) {
        throw new Error("Coinbase wallet detected. Please use MetaMask wallet only.");
      }
      
      if (ethereum.isBraveWallet === true) {
        throw new Error("Brave wallet detected. Please use MetaMask wallet only.");
      }
      
      console.log('✅ Verified MetaMask provider, requesting connection...');
      console.log('Using provider:', {
        isMetaMask: ethereum.isMetaMask,
        constructor: ethereum.constructor?.name
      });
      
      // CRITICAL: Verify one more time before making requests
      // This ensures we're using MetaMask, not OKX
      if (ethereum.isMetaMask !== true) {
        throw new Error("Cannot connect: Provider is not MetaMask. Please disable OKX extension.");
      }
      
      console.log('🔒 Using MetaMask provider for all requests');
      
      // IMPORTANT: Use the specific MetaMask provider instance, not window.ethereum
      // Request account access - this will open MetaMask popup
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      // Verify the response is from MetaMask
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. Please approve the connection in MetaMask.");
      }
      
      console.log('✅ MetaMask connection approved');

              // Switch to correct network using MetaMask provider
              try {
                await ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
                });
              } catch (switchError: any) {
                // Network doesn't exist, add it
                if (switchError.code === 4902) {
                  await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                        chainName: NETWORK_CONFIG.networkName,
                        rpcUrls: [NETWORK_CONFIG.rpcUrl],
                        nativeCurrency: {
                          name: "ETH",
                          symbol: "ETH",
                          decimals: 18,
                        },
                        // Note: MetaMask doesn't support setting default gas prices in network config
                        // Users can edit gas prices in the transaction popup
                      },
                    ],
                  });
                } else {
                  throw switchError;
                }
              }

      // Create ethers provider using the MetaMask provider instance
      const ethersProvider = new ethers.BrowserProvider(ethereum);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethersProvider.getNetwork();
      
      // Final verification: Check the address matches what we requested
      console.log('✅ Connected to MetaMask:', address);

      setWallet({
        account: address,
        provider: ethersProvider,
        signer,
        isConnected: true,
        chainId: Number(network.chainId),
      });

      // Listen for account changes
      ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          checkConnection();
        }
      });

      // Listen for chain changes
      ethereum.on("chainChanged", () => {
        checkConnection();
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function disconnect() {
    setWallet({
      account: null,
      provider: null,
      signer: null,
      isConnected: false,
      chainId: null,
    });
  }

  return {
    wallet,
    connect,
    disconnect,
    isLoading,
    error,
  };
}