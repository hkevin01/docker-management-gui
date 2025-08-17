import { Typography, Box, Alert } from '@mui/material'
import { useNetworks } from '../lib/hooks'

function NetworksPage() {
  const { data, isLoading, error } = useNetworks()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Networks
      </Typography>
      {isLoading && <Alert severity="info">Loading networks…</Alert>}
      {error && <Alert severity="error">Failed to load networks</Alert>}
      {!isLoading && !error && (!((data?.data as any[])?.length) ? (
        <Alert severity="warning">No networks found.</Alert>
      ) : (
        <Typography variant="body1">Found {(data?.data as any[])?.length} networks.</Typography>
      ))}
    </Box>
  )
}

export default NetworksPage
