import { useState, useEffect } from 'react'
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { supabase } from '../lib/supabase'

export default function AsistenciaModal() {
  const [nombre, setNombre] = useState('')
  const [comuna, setComuna] = useState('Detectando ubicación...')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=es`
            )
            const data = await res.json()

            const comuna = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.state || 
                          'Ubicación desconocida'

            setComuna(comuna)
          } catch (err) {
            setComuna('Ubicación no disponible')
          }
        },
        (err) => {
          console.warn('Error de geolocalización:', err)
          setComuna('Permiso denegado')
        },
        { timeout: 10000 }
      )
    } else {
      setComuna('Geolocalización no soportada')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setEnviando(true)
    setError('')

    const { error } = await supabase
      .from('asistencias')
      .insert({
        nombre: nombre.trim(),
        comuna: comuna.includes('Detectando') || comuna.includes('no disponible') ? 'Sin ubicación' : comuna.trim()
      })

    setEnviando(false)
    if (error) {
      setError('Error al registrar. Intenta de nuevo.')
    } else {
      setExito(true)
    }
  }

  if (exito) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" color="success.main" gutterBottom>
          ¡Asistencia registrada!
        </Typography>
        <Typography variant="h6">Gracias, {nombre}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          <LocationOnIcon fontSize="small" /> {comuna}
        </Typography>
        <Typography variant="body2" color="#000000" sx={{ mt: 2 }}>
          Puedes cerrar esta pestaña
        </Typography>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 420, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom align="center" color="#000000">
        Confirma tu asistencia
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="Tu nombre completo"
        fullWidth
        margin="normal"
        color="success"
        required
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        disabled={enviando}
          sx={{
          maxWidth: '500px', // Ancho máximo para no ocupar toda la pantalla
          width: '100%',
          '& .MuiInputBase-input': {
            color: 'black',
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: 'black',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&:hover fieldset': {
              borderColor: 'black',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4caf50',
            },
          }
        }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 3, py: 1.7 }}
        disabled={enviando || !nombre.trim()}
      >
        {enviando ? <CircularProgress size={28} color="inherit" /> : 'Registrar Asistencia'}
      </Button>
    </Box>
  )
}