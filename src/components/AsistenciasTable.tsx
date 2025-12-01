import { useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Paper, Typography, Box } from '@mui/material'
import { supabase } from '../lib/supabase'
import { comunasChile } from '../utils/comunasChile'

interface Asistencia {
  id: string
  nombre: string
  comuna: string
  fecha: string
  hora: string
  creado_en: string
}

export default function AsistenciasTable() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)

  // Función para validar si una comuna existe en la lista
  const validarComuna = (comuna: string) => {
    return comunasChile.includes(comuna) ? comuna : 'Comuna no reconocida'
  }

  const cargarAsistencias = async () => {
    const { data } = await supabase
      .from('asistencias')
      .select('id, nombre, comuna, fecha, hora, creado_en')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })

    // Validar las comunas al cargar los datos
    const asistenciasValidadas = (data || []).map(asistencia => ({
      ...asistencia,
      comuna: validarComuna(asistencia.comuna)
    }))

    setAsistencias(asistenciasValidadas)
    setLoading(false)
  }

  useEffect(() => {
    cargarAsistencias()

    const channel = supabase
      .channel('asistencias-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'asistencias' },
        (payload) => {
          const nuevo = payload.new as any
          if (nuevo?.id) {
            setAsistencias((prev) => [
              {
                id: nuevo.id,
                nombre: nuevo.nombre || 'Sin nombre',
                comuna: validarComuna(nuevo.comuna || 'Sin comuna'),
                fecha: nuevo.fecha,
                hora: nuevo.hora,
                creado_en: nuevo.creado_en,
              },
              ...prev,
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  // Función para formatear fecha CORREGIDA
  const formatearFecha = (fechaString: string) => {
    try {
      // Crear fecha en UTC y convertir a Chile
      const fecha = new Date(fechaString + 'T00:00:00Z') // Agregar tiempo para evitar problemas de timezone
      
      return fecha.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return fechaString
    }
  }

  // Función para formatear hora en formato 24 horas
  const formatearHora = (horaString: string) => {
    try {
      // Si viene en formato de tiempo PostgreSQL con milisegundos
      if (horaString.includes('.')) {
        // Tomamos solo la parte antes del punto
        const horaParte = horaString.split('.')[0]
        
        // Convertir la hora UTC a hora de Chile
        const [horasUTC, minutosUTC, segundosUTC] = horaParte.split(':')
        
        // Crear fecha en UTC
        const hoy = new Date()
        const fechaUTC = new Date(Date.UTC(
          hoy.getUTCFullYear(),
          hoy.getUTCMonth(), 
          hoy.getUTCDate(),
          parseInt(horasUTC),
          parseInt(minutosUTC || '0'),
          parseInt(segundosUTC || '0')
        ))
        
        // Convertir a hora de Chile en formato 24 horas
        return fechaUTC.toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }
      
      // Si ya viene en formato HH:mm:ss (UTC)
      const [horasUTC, minutosUTC, segundosUTC] = horaString.split(':')
      const hoy = new Date()
      const fechaUTC = new Date(Date.UTC(
        hoy.getUTCFullYear(),
        hoy.getUTCMonth(),
        hoy.getUTCDate(),
        parseInt(horasUTC),
        parseInt(minutosUTC || '0'),
        parseInt(segundosUTC || '0')
      ))
      
      return fechaUTC.toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
    } catch (error) {
      // Fallback: si hay error, mostrar la hora original sin milisegundos
      if (horaString.includes('.')) {
        return horaString.split('.')[0]
      }
      return horaString
    }
  }

  // Función para obtener estadísticas de comunas
  const obtenerEstadisticasComunas = () => {
    const conteoComunas: Record<string, number> = {}
    
    asistencias.forEach(asistencia => {
      conteoComunas[asistencia.comuna] = (conteoComunas[asistencia.comuna] || 0) + 1
    })
    
    return conteoComunas
  }

  const columns = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 220,
    },
    {
      field: 'comuna',
      headerName: 'Comuna',
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) => formatearFecha(params.value)
    },
    {
      field: 'hora',
      headerName: 'Hora',
      width: 120,
      renderCell: (params) => formatearHora(params.value)
    },
  ]

  const estadisticas = obtenerEstadisticasComunas()

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="600" align="center">
        Asistencias del día • {asistencias.length} presentes
      </Typography>

      <Paper elevation={3} sx={{ height: 650, width: '100%', borderRadius: 3 }}>
        <DataGrid
          rows={asistencias}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover',
            },
          }}
          localeText={{
            noRowsLabel: 'Aún no hay asistencias registradas hoy',
          }}
        />
      </Paper>
    </Box>
  )
}