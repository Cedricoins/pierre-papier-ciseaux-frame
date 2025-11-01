import type { AppProps } from 'next/app';
import { WagmiProvider, createConfig, http, createConnector } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { injected, walletConnect } from 'wagmi/connectors';
import '@rainbow-me/rainbowkit/styles.css';

// Farcaster wallet connector using Mini App SDK
const farcasterConnector = createConnector((config) => {
  let provider: any = null;

  return {
    id: 'farcaster',
    name: 'Farcaster Wallet',
    type: 'injected',
    async setup() {
      // Setup will be done dynamically
    },
    async connect(parameters) {
      if (typeof window === 'undefined') {
        throw new Error('Cannot connect in SSR context');
      }

      // Check if we're in a Farcaster frame
      const isInFrame = window.parent !== window;
      if (!isInFrame) {
        throw new Error('Farcaster wallet is only available in Farcaster frames');
      }

      try {
        // Dynamically import the SDK
        const sdkModule = await import('@farcaster/frame-sdk');
        const sdk = sdkModule.default;
        
        // Get the Ethereum provider from Farcaster SDK
        provider = await sdk.wallet.getEthereumProvider();
        
        if (!provider) {
          throw new Error('Farcaster wallet provider not available');
        }

        // Request accounts
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const chainId = await provider.request({ method: 'eth_chainId' });

        // Set up event listeners
        provider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            config.emitter.emit('disconnect');
          } else {
            config.emitter.emit('change', { 
              accounts: accounts.map((account: string) => account as `0x${string}`) 
            });
          }
        });

        provider.on('chainChanged', (chainId: string) => {
          config.emitter.emit('change', { 
            chainId: Number(chainId) as typeof base.id 
          });
        });

        provider.on('disconnect', () => {
          config.emitter.emit('disconnect');
        });

        return {
          accounts: accounts.map((account: string) => account as `0x${string}`),
          chainId: Number(chainId) as typeof base.id,
        };
      } catch (error: any) {
        console.error('Farcaster wallet connection error:', error);
        throw new Error(`Failed to connect to Farcaster wallet: ${error.message}`);
      }
    },
    async disconnect() {
      provider?.removeAllListeners?.();
      provider = null;
    },
    async getAccounts() {
      if (!provider) {
        if (typeof window === 'undefined') return [];
        const isInFrame = window.parent !== window;
        if (!isInFrame) return [];
        
        try {
          const sdkModule = await import('@farcaster/frame-sdk');
          const sdk = sdkModule.default;
          provider = await sdk.wallet.getEthereumProvider();
        } catch {
          return [];
        }
      }

      if (!provider) return [];

      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        return accounts.map((account: string) => account as `0x${string}`);
      } catch {
        return [];
      }
    },
    async getChainId() {
      if (!provider) {
        if (typeof window === 'undefined') return base.id;
        const isInFrame = window.parent !== window;
        if (!isInFrame) return base.id;
        
        try {
          const sdkModule = await import('@farcaster/frame-sdk');
          const sdk = sdkModule.default;
          provider = await sdk.wallet.getEthereumProvider();
        } catch {
          return base.id;
        }
      }

      if (!provider) return base.id;

      try {
        const chainId = await provider.request({ method: 'eth_chainId' });
        return Number(chainId) as typeof base.id;
      } catch {
        return base.id;
      }
    },
    async isAuthorized() {
      const accounts = await this.getAccounts();
      return accounts.length > 0;
    },
    async getProvider() {
      if (!provider) {
        if (typeof window === 'undefined') return null;
        const isInFrame = window.parent !== window;
        if (!isInFrame) return null;
        
        try {
          const sdkModule = await import('@farcaster/frame-sdk');
          const sdk = sdkModule.default;
          provider = await sdk.wallet.getEthereumProvider();
        } catch {
          return null;
        }
      }
      return provider;
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', { accounts: accounts.map((account: string) => account as `0x${string}`) });
      }
    },
    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId: Number(chainId) as typeof base.id });
    },
    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  };
});

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterConnector, // Farcaster wallet first - highest priority
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    }),
  ],
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#764ba2',
            accentColorForeground: 'white',
          })}
        >
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
