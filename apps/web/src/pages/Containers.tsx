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
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  PlaylistPlay as BulkStartIcon,
  StopCircle as BulkStopIcon,
} from '@mui/icons-material'
import {
  useContainers,
  useStartContainer,
  useStopContainer,
  useRestartContainer,
  useKillContainer,
  useRemoveContainer,
  usePruneContainers,
} from '../lib/hooks'

function ContainersPage() {
  const { data, isLoading, error, refetch } = useContainers({ all: true })
  const [selected, setSelected] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuContainerId, setMenuContainerId] = useState<string>('')
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

  const startContainerMutation = useStartContainer()
  const stopContainerMutation = useStopContainer()
  const restartContainerMutation = useRestartContainer()
  const killContainerMutation = useKillContainer()
  const removeContainerMutation = useRemoveContainer()
  const pruneContainersMutation = usePruneContainers()

  const containers = data?.data || []

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(containers.map(container => container.Id))
    } else {
      setSelected([])
    }
  }

  const handleSelectOne = (containerId: string) => {
    const selectedIndex = selected.indexOf(containerId)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, containerId)
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, containerId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuContainerId(containerId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuContainerId('')
  }

  const handleStartContainer = (containerId: string) => {
    startContainerMutation.mutate(containerId)
    handleMenuClose()
  }

  const handleStopContainer = (containerId: string) => {
    stopContainerMutation.mutate({ id: containerId })
    handleMenuClose()
  }

  const handleRestartContainer = (containerId: string) => {
    restartContainerMutation.mutate({ id: containerId })
    handleMenuClose()
  }

  const handleKillContainer = (containerId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Kill Container',
      message: 'Are you sure you want to kill this container? This will forcefully terminate the container.',
      action: () => {
        killContainerMutation.mutate({ id: containerId })
        handleMenuClose()
      }
    })
  }

  const handleRemoveContainer = (containerId: string, force = false) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Container',
      message: `Are you sure you want to remove this container? ${force ? 'This will force remove the container.' : ''}`,
      action: () => {
        removeContainerMutation.mutate(
          { id: containerId, options: { force } },
          {
            onSuccess: () => {
              setSelected(selected.filter(id => id !== containerId))
              handleMenuClose()
            }
          }
        )
      }
    })
  }

  const handleBulkStart = () => {
    const stoppedSelected = selected.filter(id => {
      const container = containers.find(c => c.Id === id)
      return container && container.State !== 'running'
    })
    
    Promise.all(
      stoppedSelected.map(containerId =>
        startContainerMutation.mutateAsync(containerId)
      )
    )
  }

  const handleBulkStop = () => {
    const runningSelected = selected.filter(id => {
      const container = containers.find(c => c.Id === id)
      return container && container.State === 'running'
    })
    
    Promise.all(
      runningSelected.map(containerId =>
        stopContainerMutation.mutateAsync({ id: containerId })
      )
    )
  }

  const handleBulkRemove = (force = false) => {
    if (selected.length === 0) return
    
    setConfirmDialog({
      open: true,
      title: 'Remove Selected Containers',
      message: `Are you sure you want to remove ${selected.length} selected container(s)? ${force ? 'This will force remove the containers.' : ''}`,
      action: () => {
        Promise.all(
          selected.map(containerId =>
            removeContainerMutation.mutateAsync({ id: containerId, options: { force } })
          )
        ).then(() => {
          setSelected([])
        })
      }
    })
  }

  const handlePruneContainers = () => {
    setConfirmDialog({
      open: true,
      title: 'Prune Stopped Containers',
      message: 'Are you sure you want to remove all stopped containers? This action cannot be undone.',
      action: () => {
        pruneContainersMutation.mutate(undefined)
      }
    })
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'success'
      case 'exited':
        return 'default'
      case 'paused':
        return 'warning'
      case 'restarting':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getContainerName = (names: string[]) => {
    if (!names || names.length === 0) return 'Unnamed'
    const firstName = names[0]
    if (!firstName) return 'Unnamed'
    return firstName.startsWith('/') ? firstName.slice(1) : firstName
  }

  const isSelected = (containerId: string) => selected.indexOf(containerId) !== -1
  const numSelected = selected.length
  const rowCount = containers.length

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Containers
      </Typography>

      {isLoading && <Alert severity="info">Loading containers…</Alert>}
      {error && <Alert severity="error">Failed to load containers</Alert>}
      
      {!isLoading && !error && (
        <>
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {numSelected > 0 ? `${numSelected} selected` : `${rowCount} containers`}
            </Typography>
            <Stack direction="row" spacing={1}>
              {numSelected > 0 && (
                <>
                  <Tooltip title="Start selected">
                    <IconButton onClick={handleBulkStart}>
                      <BulkStartIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Stop selected">
                    <IconButton onClick={handleBulkStop}>
                      <BulkStopIcon />
                    </IconButton>
                  </Tooltip>
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
              <Tooltip title="Prune stopped containers">
                <IconButton onClick={handlePruneContainers}>
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
            <Alert severity="warning">No containers found.</Alert>
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
                    <TableCell>Name</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Container ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {containers.map((container) => {
                    const isItemSelected = isSelected(container.Id)
                    const containerName = getContainerName(container.Names)
                    
                    return (
                      <TableRow
                        key={container.Id}
                        hover
                        onClick={() => handleSelectOne(container.Id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isItemSelected} />
                        </TableCell>
                        <TableCell>{containerName}</TableCell>
                        <TableCell>{container.Image}</TableCell>
                        <TableCell>
                          <code>{container.Id.slice(0, 12)}</code>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={container.State}
                            size="small"
                            color={getStatusColor(container.State) as any}
                          />
                        </TableCell>
                        <TableCell>{formatDate(container.Created)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {container.State === 'running' ? (
                              <Tooltip title="Stop">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStopContainer(container.Id)
                                  }}
                                >
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Start">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartContainer(container.Id)
                                  }}
                                >
                                  <StartIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMenuOpen(e, container.Id)
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Stack>
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
        {(() => {
          const container = containers.find(c => c.Id === menuContainerId)
          if (!container) return null
          
          return (
            <>
              {container.State === 'running' ? (
                <>
                  <MenuItem onClick={() => handleStopContainer(menuContainerId)}>
                    <StopIcon sx={{ mr: 1 }} /> Stop
                  </MenuItem>
                  <MenuItem onClick={() => handleRestartContainer(menuContainerId)}>
                    <RestartIcon sx={{ mr: 1 }} /> Restart
                  </MenuItem>
                  <MenuItem onClick={() => handleKillContainer(menuContainerId)}>
                    <DeleteIcon sx={{ mr: 1 }} /> Kill
                  </MenuItem>
                </>
              ) : (
                <MenuItem onClick={() => handleStartContainer(menuContainerId)}>
                  <StartIcon sx={{ mr: 1 }} /> Start
                </MenuItem>
              )}
              <MenuItem onClick={() => handleRemoveContainer(menuContainerId, false)}>
                <DeleteIcon sx={{ mr: 1 }} /> Remove
              </MenuItem>
              <MenuItem onClick={() => handleRemoveContainer(menuContainerId, true)}>
                <DeleteSweepIcon sx={{ mr: 1 }} /> Force Remove
              </MenuItem>
            </>
          )
        })()}
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
            disabled={
              startContainerMutation.isPending ||
              stopContainerMutation.isPending ||
              restartContainerMutation.isPending ||
              killContainerMutation.isPending ||
              removeContainerMutation.isPending ||
              pruneContainersMutation.isPending
            }
          >
            {(startContainerMutation.isPending ||
              stopContainerMutation.isPending ||
              restartContainerMutation.isPending ||
              killContainerMutation.isPending ||
              removeContainerMutation.isPending ||
              pruneContainersMutation.isPending) ? (
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

export default ContainersPage
