import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { getTier } from '../utils/tierUtils';

function Rewards({ user, isAuth }) {
  const currentStays = isAuth ? user.stays_count : 0;
  const currentTier = getTier(currentStays);

  const tiers = [
    {
      id: 'gold',
      title: 'Gold',
      icon: '⭐',
      stays: 2,
      color: '#eab308',
      desc: 'Per chi inizia a sentirsi a casa.',
      rewards: [
        'Un prodotto alimentare a tua scelta (da supermercato/alimentari) che troverai pronto al tuo arrivo.',
        'Priorità nella scelta del posto letto (se gli altri ospiti non hanno un grado superiore al tuo).'
      ]
    },
    {
      id: 'platinum',
      title: 'Platinum',
      icon: '💎',
      stays: 3,
      color: '#0ea5e9',
      desc: 'Ospiti fedeli che amano la casa.',
      rewards: [
        'Un kebab da Emir offerto durante la tua permanenza! 🥙',
        'Priorità nella scelta del posto letto (se gli altri ospiti non hanno un grado superiore al tuo).'
      ]
    },
    {
      id: 'legend',
      title: 'Legend',
      icon: '🔥',
      stays: 4,
      color: '#ef4444',
      desc: 'Una vera leggenda di Chill House.',
      rewards: [
        'Accoglienza speciale con pranzo o cena: menù personalizzato scelto da te!',
        'Priorità nella scelta del posto letto (se gli altri ospiti non hanno un grado superiore al tuo).'
      ]
    },
    {
      id: 'goat',
      title: 'G.O.A.T.',
      icon: '🐐',
      stays: 5,
      color: '#8b5cf6',
      desc: 'Greatest Of All Time.',
      rewards: [
        'Piazzamento ufficiale nella "Hall of Fame" della casa con foto annessa. 🖼️',
        'Un premio a tua scelta tra tutti quelli dei gradi inferiori.',
        'Priorità assoluta nella scelta del posto letto (comandi tu).'
      ]
    }
  ];

  const calculateProgress = () => {
    if (!isAuth) return 0;
    if (!currentTier.next) return 100; // E' già GOAT
    return Math.min(100, Math.round((currentStays / currentTier.next) * 100));
  };

  return (
    <div className="container py-5 animate-fade-in flex-grow-1">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '3rem', color: '#f1f5f9' }}>Rewards & Gradi 🏆</h2>
        <p className="text-muted fs-5">Più vieni a trovarci, più ti premiamo.</p>
      </div>

      {isAuth && (
        <Card className="modern-card mb-5 p-4 mx-auto border-0 shadow-lg text-center" style={{ maxWidth: '800px', backgroundColor: '#1e293b' }}>
          <h4 className="text-white fw-bold mb-3">Il tuo Status</h4>
          <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
            <span style={{ fontSize: '3rem' }}>{currentTier.icon}</span>
            <div className="text-start">
              <h2 className="mb-0 fw-bolder" style={{ color: currentTier.color }}>{currentTier.name}</h2>
              <p className="text-muted mb-0">{currentStays} {currentStays === 1 ? 'soggiorno' : 'soggiorni'} confermati</p>
            </div>
          </div>
          
          {currentTier.next ? (
            <div className="px-md-5 text-start">
              <div className="d-flex justify-content-between mb-1">
                <span className="small fw-bold text-muted text-uppercase">Progresso verso il prossimo grado</span>
                <span className="small fw-bold text-white">{currentStays} / {currentTier.next}</span>
              </div>
              <ProgressBar now={calculateProgress()} style={{ height: '10px' }} variant="info" />
              <p className="text-center text-muted small mt-2">
                Ti {currentTier.next - currentStays === 1 ? 'manca' : 'mancano'} ancora {currentTier.next - currentStays} {currentTier.next - currentStays === 1 ? 'soggiorno' : 'soggiorni'} per salire di livello!
              </p>
            </div>
          ) : (
            <div className="px-md-5">
              <ProgressBar now={100} style={{ height: '10px' }} variant="success" />
              <p className="text-center text-success fw-bold small mt-2">
                Hai raggiunto il grado massimo! Sei il Re di Chill House.
              </p>
            </div>
          )}
        </Card>
      )}

      {!isAuth && (
        <div className="text-center mb-5">
          <span className="badge bg-primary p-2 fs-6">Effettua il Login per vedere a che grado sei e i tuoi progressi!</span>
        </div>
      )}

      <div className="row g-4">
        {tiers.map((tier) => (
          <Col md={6} lg={3} key={tier.id}>
            <Card className="modern-card h-100 position-relative text-center border-0" style={{ 
              backgroundColor: '#0f172a',
              boxShadow: currentTier.name === tier.title && isAuth ? `0 0 20px ${tier.color}40` : 'none',
              transform: currentTier.name === tier.title && isAuth ? 'scale(1.03)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {currentTier.name === tier.title && isAuth && (
                <div className="position-absolute w-100 text-center" style={{ top: '-15px', left: 0 }}>
                  <span className="badge p-2 text-dark fw-bold shadow-sm" style={{ backgroundColor: tier.color, borderRadius: '20px' }}>IL TUO GRADO</span>
                </div>
              )}
              
              <div className="mt-4 mb-3">
                <span style={{ fontSize: '4rem' }}>{tier.icon}</span>
              </div>
              <h3 className="fw-bolder" style={{ color: tier.color }}>{tier.title}</h3>
              <div className="text-muted small fw-bold mb-3">{tier.stays} {tier.stays === 1 ? 'soggiorno' : 'soggiorni'} richiesti</div>
              <p className="text-light fst-italic small mb-4">"{tier.desc}"</p>
              
              <div className="text-start mt-auto p-3 rounded" style={{ backgroundColor: '#1e293b' }}>
                <h6 className="fw-bold text-white mb-3 border-bottom pb-2" style={{ borderColor: '#334155 !important' }}>Premi esclusivi:</h6>
                <ul className="text-muted small ps-3 mb-0" style={{ listStyleType: 'disc' }}>
                  {tier.rewards.map((reward, idx) => (
                    <li key={idx} className="mb-2">{reward}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </div>
    </div>
  );
}

export default Rewards;
