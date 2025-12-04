import { useState, useEffect } from 'react'
import { Container, Typography, Box, Alert } from '@mui/material'
import QRGenerator from './components/QRGenerator'
import AsistenciaModal from './components/AsistenciaModal'
import AsistenciasTable from './components/AsistenciasTable'

function App() {
  const [esPaginaEscaneo, setEsPaginaEscaneo] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'scan') {
      setEsPaginaEscaneo(true)
    }
  }, [])

  return (
    <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3, 
          mb: 2 
        }}>
          <img 
            src="/logo_udec_2.png" 
            alt="Logo Universidad de Concepción" 
            style={{ 
              maxWidth: '200px', 
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>
     
      <Box sx={{ my: 4 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          align="center" 
          color="#1976d2" 
          fontWeight="bold"
          sx={{ 
            mt: 1, // Reduce el margen superior ya que el logo lo tiene
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' } // Responsive
          }}
        >
          Registro de Asistencia
        </Typography>
        
        {esPaginaEscaneo ? (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              ¡Bienvenido! Escaneaste el QR correctamente. Por favor completa tu registro.
            </Alert>
            <AsistenciaModal />
          </>
        ) : (
          <>
            <QRGenerator />
            <Box sx={{ mt: 6 }}>
              <Typography variant="h4" gutterBottom align="center" color="#000000">
                Asistencias del día
              </Typography>
              <AsistenciasTable />
            </Box>
          </>
        )}
        <Box sx={{ textAlign: 'center', mt: 2, color: '#000000' }}>
          <Typography variant="body2">
            Desarrollado por Consultora SinergiaDigital • Copyright © 2025
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default App