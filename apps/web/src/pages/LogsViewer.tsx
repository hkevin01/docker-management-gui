import { useEffect, useRef, useState } from 'react'
import { Box, Typography, TextField, Button, Alert, CircularProgress, Stack } from '@mui/material'
import { apiClient } from '../lib/apiClient'

export default function LogsViewerPage() {
  const [containerId, setContainerId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const connect = () => {
    setError(null)
    setLines([])
    try {
      setConnecting(true)
      const ws = apiClient.createLogsWebSocket(containerId, { follow: true, stdout: true, stderr: true, tail: '100' })
      wsRef.current = ws
      ws.onopen = () => setConnecting(false)
      ws.onerror = () => setError('WebSocket error')
      ws.onclose = () => {}
      ws.onmessage = (ev) => {
        const text = typeof ev.data === 'string' ? ev.data : ''
        setLines((prev) => [...prev, text].slice(-500))
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to open WebSocket')
      setConnecting(false)
    }
  }

  useEffect(() => () => { wsRef.current?.close() }, [])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Logs Viewer (WS)
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField label="Container ID" value={containerId} onChange={(e) => setContainerId(e.target.value)} size="small" />
        <Button variant="contained" onClick={connect} disabled={!containerId || connecting}>Connect</Button>
        {connecting && <CircularProgress size={24} />}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="pre" sx={{ bgcolor: '#111', color: '#0f0', p: 2, borderRadius: 1, height: 300, overflow: 'auto' }}>
        {lines.join('\n')}
      </Box>
    </Box>
  )
}
