import { Box, Typography, Alert } from '@mui/material'
import { useImages } from '../lib/hooks'

function ImagesPage() {
  const { data, isLoading, error } = useImages()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Images
      </Typography>
      {isLoading && <Alert severity="info">Loading images…</Alert>}
      {error && <Alert severity="error">Failed to load images</Alert>}
      {!isLoading && !error && (!data?.data?.length ? (
        <Alert severity="warning">No images found.</Alert>
      ) : (
        <Typography variant="body1">Found {data?.data?.length} images.</Typography>
      ))}
    </Box>
  )
}

export default ImagesPage
