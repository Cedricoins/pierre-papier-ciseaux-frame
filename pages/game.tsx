import sdk from '@farcaster/frame-sdk';
import { useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CONTRACT_ADDRESS = '0xE7e255228EBA6ad9422E7F8E76aB31ffeb8E8b1B' as `0x${string}`;
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_choix', type: 'uint256' }],
    name: 'jouer',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_nom', type: 'string' }],
    name: 'creerProfil',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'obtenirStats',
    outputs: [
      { internalType: 'string', name: 'nom', type: 'string' },
      { internalType: 'uint256', name: 'victoires', type: 'uint256' },
      { internalType: 'uint256', name: 'defaites', type: 'uint256' },
      { internalType: 'uint256', name: 'egalites', type: 'uint256' },
      { internalType: 'uint256', name: 'totalParties', type: 'uint256' },
      { internalType: 'uint256', name: 'tauxVictoire', type: 'uint256' },
      { internalType: 'uint256', name: 'serieActuelle', type: 'uint256' },
      { internalType: 'uint256', name: 'meilleureSerie', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'joueurs',
    outputs: [
      { internalType: 'string', name: 'nom', type: 'string' },
      { internalType: 'uint256', name: 'victoires', type: 'uint256' },
      { internalType: 'uint256', name: 'defaites', type: 'uint256' },
      { internalType: 'uint256', name: 'egalites', type: 'uint256' },
      { internalType: 'uint256', name: 'serieActuelle', type: 'uint256' },
      { internalType: 'uint256', name: 'meilleureSerie', type: 'uint256' },
      { internalType: 'bool', name: 'existe', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function Game() {
  const [mode, setMode] = useState<'free' | 'onchain'>('free');
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [freeScore, setFreeScore] = useState({ wins: 0, losses: 0, ties: 0 });
  const [showResult, setShowResult] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Check if player exists
  const { data: playerData, refetch: refetchPlayer } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'joueurs',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address }
  });

  // Get on-chain stats
  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'obtenirStats',
    query: { enabled: isConnected && playerData && (playerData as any)[6] === true }
  });

  // Wait for transaction
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { connector: activeConnector } = useAccount();

  // Initialize Farcaster SDK and force Farcaster wallet connection when in frame
  useEffect(() => {
    const initFarcaster = async () => {
      const isInFarcaster = window.parent !== window;
      setIsInFrame(isInFarcaster);
      
      if (isInFarcaster) {
        try {
          // Initialize Farcaster SDK context
          const context = await sdk.context;
          setFarcasterUser(context.user);
          
          // Find Farcaster wallet connector
          const farcasterConnector = connectors.find(c => c.id === 'farcaster');
          
          if (!farcasterConnector) {
            console.warn('Farcaster connector not found in available connectors');
            sdk.actions.ready();
            return;
          }

          // Check if already connected to Farcaster wallet
          const isFarcasterConnected = isConnected && activeConnector?.id === 'farcaster';
          
          if (!isFarcasterConnected) {
            // Disconnect from any other wallet (like MetaMask) first
            if (isConnected && activeConnector && activeConnector.id !== 'farcaster') {
              console.log('Disconnecting from', activeConnector.name, 'to use Farcaster wallet');
              try {
                await disconnect();
              } catch (disconnectError) {
                console.warn('Error disconnecting from previous wallet:', disconnectError);
              }
            }
            
            // Connect to Farcaster wallet
            try {
              await connect({ connector: farcasterConnector });
              console.log('✅ Connected to Farcaster wallet');
            } catch (connectError: any) {
              console.error('Farcaster wallet connection error:', connectError);
              // Don't block the app if connection fails
            }
          } else {
            console.log('Already connected to Farcaster wallet');
          }
          
          // Mark frame as ready
          sdk.actions.ready();
        } catch (error) {
          console.error('Farcaster SDK initialization error:', error);
          // Call ready anyway to not block the frame
          try {
            sdk.actions.ready();
          } catch (readyError) {
            console.error('Error calling sdk.actions.ready():', readyError);
          }
        }
      }
    };
    
    initFarcaster();
  }, [connectors, connect, disconnect, isConnected, activeConnector]);


  useEffect(() => {
    if (isSuccess) {
      refetchPlayer();
      refetchStats();
      setResult('✅ Transaction confirmed!');
      setTimeout(() => setShowResult(true), 500);
    }
  }, [isSuccess]);

  const playFree = (playerChoice: number) => {
    setChoice(playerChoice);
    setShowResult(false);
    
    setTimeout(() => {
      const computerChoice = Math.floor(Math.random() * 3);
      const choices = ['🪨 Rock', '📄 Paper', '✂️ Scissors'];
      
      let outcome = '';
      if (playerChoice === computerChoice) {
        outcome = '🤝 Tie!';
        setFreeScore(prev => ({ ...prev, ties: prev.ties + 1 }));
      } else if (
        (playerChoice === 0 && computerChoice === 2) ||
        (playerChoice === 1 && computerChoice === 0) ||
        (playerChoice === 2 && computerChoice === 1)
      ) {
        outcome = '🎉 You Win!';
        setFreeScore(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else {
        outcome = '😞 You Lose';
        setFreeScore(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
      
      setResult(`${choices[playerChoice]} vs ${choices[computerChoice]} • ${outcome}`);
      setShowResult(true);
    }, 300);
  };

  const playOnChain = async (playerChoice: number) => {
    if (!isConnected) {
      setResult('❌ Please connect your wallet first');
      setShowResult(true);
      return;
    }

    const playerExists = playerData && (playerData as any)[6] === true;
if (!playerExists) {
      setShowNameInput(true);
      return;
    }

    try {
      setChoice(playerChoice);
      setResult('⏳ Sending transaction...');
      setShowResult(true);
      
writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'jouer',
  args: [BigInt(playerChoice)],
} as any);

    } catch (error) {
      console.error(error);
      setResult('❌ Transaction failed');
    }
  };

  const createProfile = async () => {
    if (!playerName) {
      alert('Please enter a name');
      return;
    }

    try {
    writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'creerProfil',
  args: [playerName],
} as any);
      setShowNameInput(false);
    } catch (error) {
      console.error(error);
    }
  };

  const resetFreeScore = () => {
    setFreeScore({ wins: 0, losses: 0, ties: 0 });
    setResult('');
    setChoice(null);
    setShowResult(false);
  };

  const currentScore = mode === 'free' 
    ? freeScore 
    : {
        wins: Number(onchainStats?.[1] || 0),
        losses: Number(onchainStats?.[2] || 0),
        ties: Number(onchainStats?.[3] || 0)
      };

  return (
    <>
      <Head>
        <title>Rock Paper Scissors - Hybrid Mode</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(40px)'
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '500px', zIndex: 1 }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎮</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: '700' }}>
            Rock Paper Scissors
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>On-Chain Game • Base Network</p>
        </div>
{farcasterUser && (
  <div style={{ 
    fontSize: '0.9rem', 
    opacity: 0.9,
    marginTop: '0.5rem'
  }}>
    Welcome @{farcasterUser.username} !
  </div>
)}
        {/* Mode Selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1.5rem',
          backgroundColor: 'rgba(255,255,255,0.15)',
          padding: '0.3rem',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          zIndex: 1
        }}>
          <button
            onClick={() => setMode('free')}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: mode === 'free' ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: '0.9rem'
            }}
          >
            🆓 Free Play
          </button>
          <button
            onClick={() => setMode('onchain')}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: mode === 'onchain' ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: '0.9rem'
            }}
          >
            ⛓️ On-Chain
          </button>
        </div>

        {/* Connect Wallet (On-Chain mode) */}
      
        {mode === 'onchain' && !isInFrame && (
          <div style={{ marginTop: '1rem', zIndex: 1 }}>
            <ConnectButton />
          </div>
        )}

        {/* Farcaster Wallet Connect Button (when in frame) */}
        {mode === 'onchain' && isInFrame && !isConnected && (
          <div style={{ marginTop: '1rem', zIndex: 1 }}>
            <button
              onClick={async () => {
                const farcasterConnector = connectors.find(c => c.id === 'farcaster');
                if (farcasterConnector) {
                  try {
                    await connect({ connector: farcasterConnector });
                    console.log('✅ Connected to Farcaster wallet');
                  } catch (error: any) {
                    console.error('Farcaster wallet connection error:', error);
                    setResult('❌ Failed to connect to Farcaster wallet');
                    setShowResult(true);
                  }
                }
              }}
              disabled={isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
                padding: '0.9rem 1.8rem',
                backgroundColor: 'rgba(139, 92, 246, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                opacity: isPending ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending) {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
                  fill="currentColor"
                />
              </svg>
              <span>{isPending ? 'Connecting...' : 'Connect Farcaster Wallet'}</span>
            </button>
          </div>
        )}

        {/* Connected Status (when in frame and connected) */}
        {mode === 'onchain' && isInFrame && isConnected && activeConnector?.id === 'farcaster' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.8rem 1.2rem',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center'
  }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#10b981"/>
            </svg>
            <span>✅ Connected with Farcaster Wallet</span>
          </div>
        )}

        {/* Wrong wallet connected warning */}
        {mode === 'onchain' && isInFrame && isConnected && activeConnector?.id !== 'farcaster' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.8rem 1.2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            textAlign: 'center'
          }}>
            ⚠️ Please connect Farcaster Wallet
          </div>
        )}

        {/* Score Board */}
        <div style={{
          display: 'flex',
          gap: '0.8rem',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '400px',
          zIndex: 1,
          marginTop: '1.5rem'
        }}>
          <div style={{
            flex: 1,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.8rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
              {currentScore.wins}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Wins</div>
          </div>
          <div style={{
            flex: 1,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.8rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>
              {currentScore.losses}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Losses</div>
          </div>
          <div style={{
            flex: 1,
            backgroundColor: 'rgba(251, 191, 36, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.8rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {currentScore.ties}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Ties</div>
          </div>
        </div>

        {/* On-Chain Stats */}
        {mode === 'onchain' && onchainStats && (
          <div style={{
            marginTop: '1rem',
            padding: '0.8rem 1.2rem',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            fontSize: '0.85rem',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            🔥 Current Streak: {onchainStats[6].toString()} | 🏆 Best Streak: {onchainStats[7].toString()}
          </div>
        )}

        {/* Create Profile Modal */}
        {showNameInput && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '20px',
              maxWidth: '300px',
              width: '90%'
            }}>
              <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Create Profile</h3>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  marginBottom: '1rem',
                  fontSize: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={createProfile}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: isPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isPending ? '⏳' : '✅ Create'}
                </button>
                <button
                  onClick={() => setShowNameInput(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Buttons */}
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '500px', zIndex: 1, marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '600' }}>
            Choose Your Move
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {[
              { emoji: '🪨', name: 'Rock', index: 0 },
              { emoji: '📄', name: 'Paper', index: 1 },
              { emoji: '✂️', name: 'Scissors', index: 2 }
            ].map((option) => (
              <button
                key={option.index}
                onClick={() => mode === 'free' ? playFree(option.index) : playOnChain(option.index)}
                disabled={mode === 'onchain' && isPending}
                style={{
                  fontSize: '3rem',
                  padding: '1.2rem',
                  backgroundColor: choice === option.index ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  cursor: (mode === 'onchain' && isPending) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  width: '100px',
                  height: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <div>{option.emoji}</div>
                <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', fontWeight: '600' }}>
                  {option.name}
                </div>
              </button>
            ))}
          </div>

          {/* Result */}
          {showResult && result && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#1f2937',
              padding: '1.2rem',
              borderRadius: '16px',
              fontSize: '1.1rem',
              fontWeight: '700',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              marginBottom: '1rem'
            }}>
              {result}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', width: '100%', zIndex: 1, marginTop: 'auto', paddingTop: '2rem' }}>
          {mode === 'free' && (
            <button
              onClick={resetFreeScore}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              🔄 Reset Score
            </button>
          )}
          
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.3rem' }}>
            {mode === 'onchain' ? '⛓️ On-Chain Mode' : '🆓 Free Play Mode'}
          </div>
          <a 
            href="https://basescan.org/address/0xE7e255228EBA6ad9422E7F8E76aB31ffeb8E8b1B"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: 'white', 
              fontSize: '0.75rem',
              opacity: 0.8,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            View Contract →
          </a>
        </div>
      </div>
    </>
  );
}