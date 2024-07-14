"use client";

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'EIP 712 Demo',
  projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}`,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API}`),
  }
});

const queryClient = new QueryClient();

export default function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}