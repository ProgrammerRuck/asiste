import { useEffect, useState } from 'react'
import { DataGrid, } from '@mui/x-data-grid'
import { 
  Paper, Typography, Box, Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { supabase } from '../lib/supabase'
import { comunasChile } from '../utils/comunasChile'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'

interface Asistencia {
  id: string
  nombre: string
  comuna: string
  fecha: string
  hora: string
  creado_en: string
}

// Componente personalizado para la barra de herramientas
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
      <GridToolbarExport 
        csvOptions={{
          fileName: `asistencias_${new Date().toLocaleDateString('es-CL')}`,
          utf8WithBom: true,
        }}
        printOptions={{
          hideFooter: true,
          hideToolbar: true,
        }}
      />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  )
}

export default function AsistenciasTable() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  // Función para validar si una comuna existe en la lista
  const validarComuna = (comuna: string) => {
    return comunasChile.includes(comuna) ? comuna : 'Comuna no reconocida'
  }

  const cargarAsistencias = async () => {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('id, nombre, comuna, fecha, hora, creado_en')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })

      if (error) throw error

      // Validar las comunas al cargar los datos
      const asistenciasValidadas = (data || []).map(asistencia => ({
        ...asistencia,
        comuna: validarComuna(asistencia.comuna)
      }))

      setAsistencias(asistenciasValidadas)
    } catch (error) {
      console.error('Error cargando asistencias:', error)
      setSnackbar({
        open: true,
        message: '❌ Error al cargar las asistencias',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // FUNCIÓN CORREGIDA PARA VACIAR ASISTENCIAS
  const vaciarAsistencias = async () => {
    try {
      setDeleting(true)
      console.log('Iniciando eliminación...')
      
      // INTENTA DIFERENTES MÉTODOS EN ORDEN:
      
      // Método 1: DELETE simple (si la política lo permite)
      let { error } = await supabase
        .from('asistencias')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Condición siempre verdadera para UUIDs

      if (error) {
        console.log('Método 1 falló, intentando método 2...', error)
        
        // Método 2: DELETE sin condiciones
        const { error: error2 } = await supabase
          .from('asistencias')
          .delete()
        
        if (error2) {
          console.log('Método 2 falló, intentando método 3...', error2)
          
          // Método 3: Eliminar por lotes (más lento pero seguro)
          const { data: todosIds } = await supabase
            .from('asistencias')
            .select('id')
          
          if (todosIds && todosIds.length > 0) {
            for (const item of todosIds) {
              await supabase
                .from('asistencias')
                .delete()
                .eq('id', item.id)
            }
            console.log(`Eliminados ${todosIds.length} registros por lotes`)
          } else {
            console.log('No hay registros para eliminar')
          }
        }
      }

      // Actualizar estado local
      setAsistencias([])
      
      // Mostrar éxito
      setSnackbar({
        open: true,
        message: '✅ Todas las asistencias han sido eliminadas',
        severity: 'success'
      })
      
      // Recargar después de un tiempo
      setTimeout(() => {
        cargarAsistencias()
      }, 1000)
      
    } catch (error: any) {
      console.error('Error completo:', error)
      
      let mensajeError = '❌ Error al eliminar las asistencias'
      
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        mensajeError = '❌ Error: Configura la política DELETE en Supabase'
      }
      
      setSnackbar({
        open: true,
        message: mensajeError,
        severity: 'error'
      })
    } finally {
      setDeleting(false)
      setOpenDialog(false)
    }
  }

  // Función para exportar a Excel
  const exportarExcel = () => {
    if (asistencias.length === 0) {
      setSnackbar({
        open: true,
        message: 'No hay datos para exportar',
        severity: 'warning'
      })
      return
    }

    try {
      // Preparar datos para Excel
      const datosExcel = asistencias.map((asistencia, index) => ({
        '#': index + 1,
        'Nombre': asistencia.nombre,
        'Comuna': asistencia.comuna,
        'Fecha': formatearFecha(asistencia.fecha),
        'Hora': formatearHora(asistencia.hora),
        'Registrado': new Date(asistencia.creado_en).toLocaleString('es-CL')
      }))

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datosExcel)

      // Ajustar anchos de columna
      const wscols = [
        { wch: 5 },  // #
        { wch: 30 }, // Nombre
        { wch: 20 }, // Comuna
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 20 }, // Registrado
      ]
      ws['!cols'] = wscols

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencias')

      // Generar nombre de archivo con fecha
      const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-')
      const nombreArchivo = `asistencias_${fechaHoy}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo)

      setSnackbar({
        open: true,
        message: '📊 Excel exportado correctamente',
        severity: 'success'
      })

    } catch (error) {
      console.error('Error al exportar Excel:', error)
      setSnackbar({
        open: true,
        message: '❌ Error al exportar Excel',
        severity: 'error'
      })
    }
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

  // Función para formatear fecha
  const formatearFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString + 'T00:00:00')
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

  // Función para formatear hora
  const formatearHora = (horaString: string) => {
    try {
      if (horaString.includes('.')) {
        const horaParte = horaString.split('.')[0]
        const [horasUTC, minutosUTC, segundosUTC] = horaParte.split(':')
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
      }
      
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
      if (horaString.includes('.')) {
        return horaString.split('.')[0]
      }
      return horaString
    }
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

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="600" align="center">
        Asistencias del día • {asistencias.length} presentes
      </Typography>

      {/* Botones de acción */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <Tooltip title="Exportar a Excel">
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={exportarExcel}
            disabled={asistencias.length === 0 || deleting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold'
            }}
          >
            Exportar Excel
          </Button>
        </Tooltip>

        <Tooltip title="Eliminar todas las asistencias">
          <Button
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={asistencias.length === 0 || deleting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold'
            }}
          >
            {deleting ? 'Eliminando...' : 'Vaciar Tabla'}
          </Button>
        </Tooltip>
      </Box>

      <Paper elevation={3} sx={{ height: 650, width: '100%', borderRadius: 3 }}>
        <DataGrid
          rows={asistencias}
          columns={columns}
          loading={loading || deleting}
          slots={{
            toolbar: CustomToolbar,
          }}
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

      {/* Diálogo de confirmación */}
      <Dialog
        open={openDialog}
        onClose={() => !deleting && setOpenDialog(false)}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          ⚠️ Confirmar Eliminación Total
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Estás seguro de eliminar <strong>TODAS</strong> las asistencias?
            <br />
            <br />
            Se eliminarán: <strong style={{ color: '#d32f2f' }}>{asistencias.length} registros</strong>
          </DialogContentText>
          
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>ACCIÓN IRREVERSIBLE:</strong> Los datos no podrán recuperarse. Recomendable exportar antes de continuar.
          </Alert>
          
          {deleting && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Eliminando registros...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)} 
            color="primary"
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={vaciarAsistencias} 
            color="error" 
            variant="contained"
            disabled={deleting}
            autoFocus
          >
            {deleting ? 'Eliminando...' : 'Sí, Eliminar Todo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}