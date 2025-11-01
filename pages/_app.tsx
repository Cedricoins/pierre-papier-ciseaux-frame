import type { AppProps } from 'next/app';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import frameConnector from '@farcaster/frame-wagmi-connector';
import { injected, walletConnect } from 'wagmi/connectors';
import '@rainbow-me/rainbowkit/styles.css';

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
connectors: [
  frameConnector(),
  injected(),
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