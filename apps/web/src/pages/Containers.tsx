import { Box, Typography, Alert } from '@mui/material'
import { useContainers } from '../lib/hooks'

function ContainersPage() {
  const { data, isLoading, error } = useContainers({ all: true })
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Containers
      </Typography>
      {isLoading && <Alert severity="info">Loading containers…</Alert>}
      {error && <Alert severity="error">Failed to load containers</Alert>}
      {!isLoading && !error && (!data?.data?.length ? (
        <Alert severity="warning">No containers found.</Alert>
      ) : (
        <Typography variant="body1">Found {data?.data?.length} containers.</Typography>
      ))}
    </Box>
  )
}

export default ContainersPage
