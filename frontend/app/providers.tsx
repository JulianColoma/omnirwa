"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState, type ReactNode } from "react";
import { config } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  // refresco periódico: muestra lo que hacen otras cuentas (votos, compras) sin recargar la página
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchInterval: 12_000, staleTime: 4_000 } } }),
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
