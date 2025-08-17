import { Box, Typography, Alert } from '@mui/material'
import { useVolumes } from '../lib/hooks'

function VolumesPage() {
  const { data, isLoading, error } = useVolumes()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Volumes
      </Typography>
      {isLoading && <Alert severity="info">Loading volumes…</Alert>}
      {error && <Alert severity="error">Failed to load volumes</Alert>}
      {!isLoading && !error && (!data?.data?.Volumes?.length ? (
        <Alert severity="warning">No volumes found.</Alert>
      ) : (
        <Typography variant="body1">Found {data?.data?.Volumes?.length} volumes.</Typography>
      ))}
    </Box>
  )
}

export default VolumesPage
