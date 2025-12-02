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
    <Container maxWidth=" ">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" color="#1976d2" fontWeight="bold">
          Registro de Asistencia QR
        </Typography>
        <Typography variant="h6" align="center" color="#000000" paragraph>
          La forma más rápida y moderna de tomar asistencia con QR dinámico
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
            Desarrollado por Jorge • 2025
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default App