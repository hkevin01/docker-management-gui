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
  Storage as StorageIcon,
} from '@mui/icons-material'
import { useVolumes, useRemoveVolume, usePruneVolumes } from '../lib/hooks'

// Utility function to format bytes into human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function VolumesPage() {
  const { data, isLoading, error, refetch } = useVolumes()
  const [selected, setSelected] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuVolumeName, setMenuVolumeName] = useState<string>('')
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

  const removeVolumeMutation = useRemoveVolume()
  const pruneVolumesMutation = usePruneVolumes()

  const volumes = data?.data?.Volumes || []

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(volumes.map(volume => volume.Name))
    } else {
      setSelected([])
    }
  }

  const handleSelectOne = (volumeName: string) => {
    const selectedIndex = selected.indexOf(volumeName)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, volumeName)
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, volumeName: string) => {
    setAnchorEl(event.currentTarget)
    setMenuVolumeName(volumeName)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuVolumeName('')
  }

  const handleRemoveVolume = (volumeName: string, force = false) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Volume',
      message: `Are you sure you want to remove volume "${volumeName}"? ${force ? 'This will force remove the volume.' : 'All data in this volume will be lost.'}`,
      action: () => {
        removeVolumeMutation.mutate(
          { name: volumeName, force },
          {
            onSuccess: () => {
              setSelected(selected.filter(name => name !== volumeName))
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
      title: 'Remove Selected Volumes',
      message: `Are you sure you want to remove ${selected.length} selected volume(s)? ${force ? 'This will force remove the volumes.' : 'All data in these volumes will be lost.'}`,
      action: () => {
        Promise.all(
          selected.map(volumeName =>
            removeVolumeMutation.mutateAsync({ name: volumeName, force })
          )
        ).then(() => {
          setSelected([])
        })
      }
    })
  }

  const handlePruneVolumes = () => {
    setConfirmDialog({
      open: true,
      title: 'Prune Unused Volumes',
      message: 'Are you sure you want to remove all unused volumes? This action cannot be undone and all data in unused volumes will be lost.',
      action: () => {
        pruneVolumesMutation.mutate(undefined)
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getVolumeScope = (scope: string) => {
    return scope === 'local' ? 'Local' : scope
  }

  const isSelected = (volumeName: string) => selected.indexOf(volumeName) !== -1
  const numSelected = selected.length
  const rowCount = volumes.length

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Volumes
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Volumes are persistent storage mechanisms that allow data to survive container restarts and be shared 
        between containers. They are managed by Docker and stored outside the container's filesystem.
      </Typography>

      {isLoading && <Alert severity="info">Loading volumes…</Alert>}
      {error && <Alert severity="error">Failed to load volumes</Alert>}
      
      {!isLoading && !error && (
        <>
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {numSelected > 0 ? `${numSelected} selected` : `${rowCount} volumes`}
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
              <Tooltip title="Prune unused volumes">
                <IconButton onClick={handlePruneVolumes}>
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
            <Alert severity="warning">No volumes found.</Alert>
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
                    <TableCell>Volume Name</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Mountpoint</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {volumes.map((volume) => {
                    const isItemSelected = isSelected(volume.Name)
                    
                    return (
                      <TableRow
                        key={volume.Name}
                        hover
                        onClick={() => handleSelectOne(volume.Name)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isItemSelected} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <StorageIcon color="action" />
                            <span>{volume.Name}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={volume.Driver}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{getVolumeScope(volume.Scope)}</TableCell>
                        <TableCell>
                          {volume.UsageData?.Size !== undefined ? (
                            <Chip
                              label={formatFileSize(volume.UsageData.Size)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              label="N/A"
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <code style={{ fontSize: '0.75rem' }}>
                            {volume.Mountpoint}
                          </code>
                        </TableCell>
                        <TableCell>{formatDate(volume.CreatedAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMenuOpen(e, volume.Name)
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
        <MenuItem onClick={() => handleRemoveVolume(menuVolumeName, false)}>
          <DeleteIcon sx={{ mr: 1 }} /> Remove
        </MenuItem>
        <MenuItem onClick={() => handleRemoveVolume(menuVolumeName, true)}>
          <DeleteSweepIcon sx={{ mr: 1 }} /> Force Remove
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
            disabled={removeVolumeMutation.isPending || pruneVolumesMutation.isPending}
          >
            {removeVolumeMutation.isPending || pruneVolumesMutation.isPending ? (
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

export default VolumesPage
