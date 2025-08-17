import React, { useState } from 'react'
import {
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Checkbox,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Toolbar,
  Tooltip,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useImages, useRemoveImage, usePruneImages } from '../lib/hooks'

function ImagesPage() {
  const { data, isLoading, error, refetch } = useImages({ all: true })
  const [selected, setSelected] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuImageId, setMenuImageId] = useState<string>('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  })

  const removeImageMutation = useRemoveImage()
  const pruneImagesMutation = usePruneImages()

  const images = data?.data || []

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(images.map(image => image.Id))
    } else {
      setSelected([])
    }
  }

  const handleSelectOne = (imageId: string) => {
    const selectedIndex = selected.indexOf(imageId)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, imageId)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }

    setSelected(newSelected)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, imageId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuImageId(imageId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuImageId('')
  }

  const handleRemoveImage = (imageId: string, force = false) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Image',
      message: `Are you sure you want to remove this image? ${force ? 'This will force remove the image.' : ''}`,
      action: () => {
        removeImageMutation.mutate(
          { id: imageId, options: { force } },
          {
            onSuccess: () => {
              setSelected(selected.filter(id => id !== imageId))
              handleMenuClose()
            }
          }
        )
      }
    })
  }

  const handleBulkRemove = (force = false) => {
    if (selected.length === 0) return
    
    setConfirmDialog({
      open: true,
      title: 'Remove Selected Images',
      message: `Are you sure you want to remove ${selected.length} selected image(s)? ${force ? 'This will force remove the images.' : ''}`,
      action: () => {
        Promise.all(
          selected.map(imageId =>
            removeImageMutation.mutateAsync({ id: imageId, options: { force } })
          )
        ).then(() => {
          setSelected([])
        })
      }
    })
  }

  const handlePruneImages = () => {
    setConfirmDialog({
      open: true,
      title: 'Prune Unused Images',
      message: 'Are you sure you want to remove all unused images? This action cannot be undone.',
      action: () => {
        pruneImagesMutation.mutate(undefined)
      }
    })
  }

  const formatSize = (size: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let unitIndex = 0
    let formattedSize = size

    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024
      unitIndex++
    }

    return `${formattedSize.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getImageName = (repoTags: string[] | null) => {
    if (!repoTags || repoTags.length === 0) return '<none>'
    return repoTags[0] || '<none>'
  }

  const isSelected = (imageId: string) => selected.indexOf(imageId) !== -1
  const numSelected = selected.length
  const rowCount = images.length

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Images
      </Typography>

      {isLoading && <Alert severity="info">Loading images…</Alert>}
      {error && <Alert severity="error">Failed to load images</Alert>}
      
      {!isLoading && !error && (
        <>
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {numSelected > 0 ? `${numSelected} selected` : `${rowCount} images`}
            </Typography>
            <Stack direction="row" spacing={1}>
              {numSelected > 0 && (
                <>
                  <Tooltip title="Remove selected">
                    <IconButton onClick={() => handleBulkRemove(false)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Force remove selected">
                    <IconButton onClick={() => handleBulkRemove(true)}>
                      <DeleteSweepIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Tooltip title="Prune unused images">
                <IconButton onClick={handlePruneImages}>
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>

          {rowCount === 0 ? (
            <Alert severity="warning">No images found.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Repository:Tag</TableCell>
                    <TableCell>Image ID</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {images.map((image) => {
                    const isItemSelected = isSelected(image.Id)
                    const imageName = getImageName(image.RepoTags)
                    
                    return (
                      <TableRow
                        key={image.Id}
                        hover
                        onClick={() => handleSelectOne(image.Id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isItemSelected} />
                        </TableCell>
                        <TableCell>
                          {imageName === '<none>' ? (
                            <Chip label="<none>" size="small" variant="outlined" />
                          ) : (
                            imageName
                          )}
                        </TableCell>
                        <TableCell>
                          <code>{image.Id.slice(7, 19)}</code>
                        </TableCell>
                        <TableCell>{formatSize(image.Size)}</TableCell>
                        <TableCell>{formatDate(image.Created)}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMenuOpen(e, image.Id)
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleRemoveImage(menuImageId, false)}>
          Remove
        </MenuItem>
        <MenuItem onClick={() => handleRemoveImage(menuImageId, true)}>
          Force Remove
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDialog.action()
              setConfirmDialog({ ...confirmDialog, open: false })
            }}
            color="error"
            autoFocus
            disabled={removeImageMutation.isPending || pruneImagesMutation.isPending}
          >
            {removeImageMutation.isPending || pruneImagesMutation.isPending ? (
              <CircularProgress size={16} />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ImagesPage
