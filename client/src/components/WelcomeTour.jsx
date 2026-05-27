import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { completeTutorial } from '../api/API.mjs';
import { useNavigate } from 'react-router-dom';

function WelcomeTour({ user, setUser }) {
  const navigate = useNavigate();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Fai partire il tour se l'utente esiste e has_seen_tutorial è falsy o "0"
    if (user && (!user.has_seen_tutorial || user.has_seen_tutorial == 0 || user.has_seen_tutorial === '0')) {
      // Piccolo timeout per assicurarsi che il DOM della Navbar sia montato e visibile
      setTimeout(() => setRun(true), 500);
    }
  }, [user]);

  const steps = [
    {
      target: 'body',
      placement: 'center',
      content: 'Benvenuto! Ti abbiamo preparato alcune novità spettacolari. Clicca su Avanti per scoprirle!',
      disableBeacon: true,
    },
    {
      target: '#tour-prenota',
      content: 'Vuoi farti ospitare? Clicca qui per prenotare le tue date in casa.',
    },
    {
      target: '#tour-bacheca',
      content: 'Qui potrai leggere e lasciare recensioni sui tuoi fantastici soggiorni.',
    },
    {
      target: '#tour-tipster',
      content: 'Nuovissima sezione! Posta le tue schedine, gufa quelle degli amici e vota i sondaggi.',
    },
    {
      target: '#tour-rewards',
      content: 'Più dormi da noi, più sali di livello e sblocchi ricompense esclusive!',
    },
    {
      target: '#tour-chat-board',
      content: 'Scopri la nuova Lavagna Condivisa e la Live Chat! Disegna, chatta in tempo reale e clicca "Invia in Chat 🚀" per mandare i tuoi capolavori agli altri!',
    }
  ];

  const handleJoyrideCallback = async (data) => {
    const { status, action, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED, 'finished', 'skipped'];
    
    console.log("Joyride callback: status=", status, "action=", action, "type=", type);

    // Intercettiamo anche 'close' in caso l'utente chiuda il popup cliccando fuori o con la X
    if (finishedStatuses.includes(status) || action === 'close' || type === 'tour:end') {
      setRun(false);
      try {
        await completeTutorial();
        // Aggiorna lo stato locale per non far ripartire il tour
        setUser(prev => ({ ...prev, has_seen_tutorial: 1 }));
      } catch (err) {
        console.error("Errore durante il completamento del tutorial", err);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5',
          backgroundColor: '#1e293b',
          textColor: '#f1f5f9',
          arrowColor: '#1e293b',
        },
        buttonClose: {
          display: 'none',
        },
        buttonSkip: {
          color: '#94a3b8',
        }
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Finito!',
        next: 'Avanti',
        skip: 'Salta Tour',
      }}
    />
  );
}

export default WelcomeTour;
