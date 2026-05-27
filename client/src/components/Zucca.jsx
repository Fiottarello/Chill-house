import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Zucca() {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 animate-fade-in" style={{ backgroundColor: '#000', minHeight: '80vh' }}>
      <h1 className="fw-bolder text-danger" style={{ fontSize: '6rem', textTransform: 'uppercase', letterSpacing: '5px', textShadow: '0 0 20px #dc3545' }}>
        ZUCCA MUORI
      </h1>
      <Button variant="outline-light" className="mt-5" onClick={() => navigate('/')}>
        Torna alla normalità
      </Button>
    </div>
  );
}

export default Zucca;
