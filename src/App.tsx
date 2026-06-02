import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { NETWORK, RPC_ENDPOINT } from '@/lib/program/cluster';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import CreateChama from './pages/CreateChama';
import ChamaDetail from './pages/ChamaDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
    const endpoint = RPC_ENDPOINT;
    const wallets = useMemo(() => [new PhantomWalletAdapter({ network: NETWORK })], []);

    return (
        <ThemeProvider>
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <AuthProvider>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/create" element={<CreateChama />} />
                            <Route path="/chama/:id" element={<ChamaDetail />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Toaster />
                    </AuthProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
        </ThemeProvider>
    );
};

export default App;
