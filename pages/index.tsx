import Head from 'next/head';

export default function Home() {
  const baseUrl = 'https://pierre-papier-ciseaux-frame.vercel.app';
  
  return (
    <>
      <Head>
        {/* Métadonnées Frame essentielles */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image/start`} />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        
        {/* Boutons avec action explicite */}
        <meta property="fc:frame:button:1" content="🪨 Pierre" />
        <meta property="fc:frame:button:1:action" content="post" />
        
        <meta property="fc:frame:button:2" content="📄 Papier" />
        <meta property="fc:frame:button:2:action" content="post" />
        
        <meta property="fc:frame:button:3" content="✂️ Ciseaux" />
        <meta property="fc:frame:button:3:action" content="post" />
        
        <meta property="fc:frame:button:4" content="📊 Stats" />
        <meta property="fc:frame:button:4:action" content="post" />
        
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/play`} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Pierre Papier Ciseaux On-Chain" />
        <meta property="og:description" content="Jouez à Pierre-Papier-Ciseaux on-chain sur Farcaster !" />
        <meta property="og:image" content={`${baseUrl}/api/image/start`} />
        
        <title>Pierre Papier Ciseaux - Farcaster Frame</title>
        <meta name="description" content="Jouez à Pierre-Papier-Ciseaux on-chain sur Farcaster !" />
      </Head>
      
      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🎮 Pierre Papier Ciseaux On-Chain</h1>
        <p>Jouez directement depuis Farcaster et suivez vos statistiques sur la blockchain !</p>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Comment jouer :</h2>
          <ol>
            <li>Partagez cette URL dans un cast sur Farcaster</li>
            <li>Cliquez sur Pierre, Papier ou Ciseaux</li>
            <li>Le contrat génère le choix de l&apos;ordinateur</li>
            <li>Consultez vos stats et votre classement</li>
          </ol>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h2>Fonctionnalités :</h2>
          <ul>
            <li>✅ Statistiques complètes on-chain</li>
            <li>🔥 Système de séries de victoires</li>
            <li>🏆 Classement global des meilleurs joueurs</li>
            <li>📈 Analyse de vos choix favoris</li>
            <li>🎯 Événements spéciaux tous les 10 victoires</li>
          </ul>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h2>⚙️ Contrat :</h2>
          <p>Base Mainnet : <code>0xb89e033cc1c909815fab56c371d50a80a05df422</code></p>
          <a 
            href="https://basescan.org/address/0xb89e033cc1c909815fab56c371d50a80a05df422" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1976d2' }}
          >
            Voir sur BaseScan →
          </a>
        </div>
      </main>
    </>
  );
}
