import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Paper, Typography, Box } from '@mui/material'

export default function QRGenerator() {
  const [qrValue] = useState(() => {
    return window.location.origin + window.location.pathname + '?mode=scan'
  })

  return (
    <Paper elevation={6} sx={{ p: 4, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom color="primary">
        Escanea para registrar tu asistencia a clases
      </Typography>
      <Box sx={{ my: 3, p: 3, bgcolor: 'white', borderRadius: 2, display: 'inline-block' }}>
        <QRCodeSVG value={qrValue} size={256} level="H" includeMargin />
      </Box>
    </Paper>
  )
}