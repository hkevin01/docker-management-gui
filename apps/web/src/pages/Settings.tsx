import { Box, Typography, TextField, Button, Alert, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import apiClient, { setApiBaseUrl } from '../lib/apiClient'

function SettingsPage() {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    const savedUrl = localStorage.getItem('apiBaseUrl') || '/api'
    setValue(savedUrl)
  }, [])

  const testHealth = async () => {
    setError(null)
    try {
      const res = await apiClient.getHealth()
      setHealth(res)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch health')
    }
  }

  const save = () => {
    setApiBaseUrl(value || '/api')
    setSaved('Saved')
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Stack spacing={2} maxWidth={600}>
        <TextField
          label="API Base Path"
          helperText="Base path for API requests (default /api). Can be full URL or relative path."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          fullWidth
        />
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={save}>Save</Button>
          <Button variant="outlined" onClick={testHealth}>Test Health</Button>
        </Box>
        {saved && <Alert severity="success">{saved}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {health && (
          <Alert severity={health.docker ? 'success' : 'warning'}>
            Health: {health.status} • Docker: {String(health.docker)} • Safe mode: {String(health.safeMode)}
          </Alert>
        )}
      </Stack>
    </Box>
  )
}

export default SettingsPage
