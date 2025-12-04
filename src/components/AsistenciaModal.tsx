import { useState } from 'react'
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { supabase } from '../lib/supabase'

export default function AsistenciaModal() {
  const [nombre, setNombre] = useState('')
  const [comuna, setComuna] = useState('Ubicación no solicitada')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')
  const [ubicacionSolicitada, setUbicacionSolicitada] = useState(false)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)

  const obtenerUbicacion = () => {
    if ('geolocation' in navigator) {
      setObteniendoUbicacion(true)
      setComuna('Obteniendo ubicación...')
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=es`
            )
            const data = await res.json()

            const comunaDetectada = data.address?.city || 
                                   data.address?.town || 
                                   data.address?.village || 
                                   data.address?.state || 
                                   'Ubicación desconocida'

            setComuna(comunaDetectada)
          } catch (err) {
            setComuna('Error al obtener ubicación')
          } finally {
            setObteniendoUbicacion(false)
          }
        },
        (err) => {
          console.warn('Error de geolocalización:', err)
          
          if (err.code === 1) {
            // PERMISSION_DENIED
            setComuna('Permiso denegado')
          } else if (err.code === 2) {
            // POSITION_UNAVAILABLE
            setComuna('Ubicación no disponible')
          } else if (err.code === 3) {
            // TIMEOUT
            setComuna('Tiempo de espera agotado')
          } else {
            setComuna('Error de geolocalización')
          }
          
          setObteniendoUbicacion(false)
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true 
        }
      )
    } else {
      setComuna('Geolocalización no soportada')
      setObteniendoUbicacion(false)
    }
  }

  const solicitarUbicacion = () => {
    setUbicacionSolicitada(true)
    obtenerUbicacion()
  }

  const reintentarUbicacion = () => {
    obtenerUbicacion()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setEnviando(true)
    setError('')

    const comunaParaEnviar = 
      comuna === 'Ubicación no solicitada' || 
      comuna === 'Permiso denegado' || 
      comuna === 'Error al obtener ubicación' || 
      comuna === 'Ubicación no disponible' || 
      comuna === 'Tiempo de espera agotado' || 
      comuna === 'Geolocalización no soportada' || 
      comuna === 'Obteniendo ubicación...'
        ? 'Sin ubicación' 
        : comuna.trim()

    const { error } = await supabase
      .from('asistencias')
      .insert({
        nombre: nombre.trim(),
        comuna: comunaParaEnviar
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
          maxWidth: '500px',
          width: '100%',
          '& .MuiInputBase-input': {
            color: 'black',
          },
          '& .MuiInputLabel-root': {
            color: 'black)',
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
      {/* Sección de ubicación */}
      <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Ubicación
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {comuna}
        </Typography>

        {!ubicacionSolicitada ? (
          <Button
            variant="outlined"
            size="medium"
            startIcon={<LocationOnIcon />}
            onClick={solicitarUbicacion}
            fullWidth
            sx={{ py: 1 }}
          >
            Obtener mi ubicación
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<LocationOnIcon />}
              onClick={reintentarUbicacion}
              disabled={obteniendoUbicacion}
              sx={{ flex: 1 }}
            >
              {obteniendoUbicacion ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Reintentar ubicación'
              )}
            </Button>
            
            {comuna === 'Permiso denegado' && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                Si negaste el permiso por error, busca el ícono de candado 🔒 en la barra de direcciones y cambia el permiso de ubicación a "Permitir"
              </Typography>
            )}
          </Box>
        )}
      </Box>

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