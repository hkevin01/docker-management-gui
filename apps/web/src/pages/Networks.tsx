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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Cable as CableIcon,
  Computer as ComputerIcon,
  Block as BlockIcon,
} from '@mui/icons-material'
import { useNetworks, useRemoveNetwork, usePruneNetworks } from '../lib/hooks'

function NetworksPage() {
  const { data, isLoading, error, refetch } = useNetworks()
  const [selected, setSelected] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuNetworkId, setMenuNetworkId] = useState<string>('')
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

  const removeNetworkMutation = useRemoveNetwork()
  const pruneNetworksMutation = usePruneNetworks()

  const networks = (data?.data as any[]) || []

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Only select user-defined networks (not system networks)
      const selectableNetworks = networks.filter(network => 
        !['bridge', 'host', 'none'].includes(network.Name)
      ).map(network => network.Id)
      setSelected(selectableNetworks)
    } else {
      setSelected([])
    }
  }

  const handleSelectOne = (networkId: string) => {
    const selectedIndex = selected.indexOf(networkId)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, networkId)
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, networkId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuNetworkId(networkId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuNetworkId('')
  }

  const handleRemoveNetwork = (networkId: string) => {
    const network = networks.find(n => n.Id === networkId)
    setConfirmDialog({
      open: true,
      title: 'Remove Network',
      message: `Are you sure you want to remove network "${network?.Name || networkId}"? This action cannot be undone.`,
      action: () => {
        removeNetworkMutation.mutate(
          networkId,
          {
            onSuccess: () => {
              setSelected(selected.filter(id => id !== networkId))
              handleMenuClose()
            }
          }
        )
      }
    })
  }

  const handleBulkRemove = () => {
    if (selected.length === 0) return
    
    setConfirmDialog({
      open: true,
      title: 'Remove Selected Networks',
      message: `Are you sure you want to remove ${selected.length} selected network(s)? This action cannot be undone.`,
      action: () => {
        Promise.all(
          selected.map(networkId =>
            removeNetworkMutation.mutateAsync(networkId)
          )
        ).then(() => {
          setSelected([])
        })
      }
    })
  }

  const handlePruneNetworks = () => {
    setConfirmDialog({
      open: true,
      title: 'Prune Unused Networks',
      message: 'Are you sure you want to remove all unused networks? This action cannot be undone.',
      action: () => {
        pruneNetworksMutation.mutate(undefined)
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getNetworkType = (network: any) => {
    if (['bridge', 'host', 'none'].includes(network.Name)) {
      return 'System'
    }
    return 'User'
  }

  const getNetworkTypeColor = (network: any) => {
    if (['bridge', 'host', 'none'].includes(network.Name)) {
      return 'default'
    }
    return 'primary'
  }

  const isSystemNetwork = (network: any) => {
    return ['bridge', 'host', 'none'].includes(network.Name)
  }

  const isSelected = (networkId: string) => selected.indexOf(networkId) !== -1
  const selectableNetworks = networks.filter(network => !isSystemNetwork(network))
  const numSelected = selected.length
  const rowCount = networks.length

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Networks
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Networks enable communication between Docker containers and the outside world. They provide isolation, 
        connectivity, and routing capabilities for containerized applications.
      </Typography>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Network Types Information</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem 
              sx={{ 
                borderRadius: 1,
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': { 
                  backgroundColor: 'primary.50',
                  cursor: 'pointer',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon>
                <CableIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Bridge Network"
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      The default network driver for containers. Creates an isolated network segment where containers can communicate with each other using internal IP addresses.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Key Features:</strong> Container-to-container communication, port mapping to host, network isolation from other bridge networks, automatic DNS resolution between containers, and support for custom bridge networks with advanced configuration options.
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <ListItem 
              sx={{ 
                borderRadius: 1,
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': { 
                  backgroundColor: 'warning.50',
                  cursor: 'pointer',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon>
                <ComputerIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Host Network"
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Removes network isolation completely - the container shares the host's network stack directly, using the same IP address and network interfaces as the host system.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Use Cases:</strong> High-performance networking requirements, legacy applications, network monitoring tools. <strong>Limitations:</strong> Linux only, potential security risks, port conflicts, reduced container portability.
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <ListItem 
              sx={{ 
                borderRadius: 1,
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': { 
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon>
                <BlockIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="None Network"
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Completely disables networking for the container. The container has no network interfaces except for a loopback device.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Use Cases:</strong> Isolated processing tasks, security-sensitive applications, containers that only need local file system access.
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {isLoading && <Alert severity="info">Loading networks…</Alert>}
      {error && <Alert severity="error">Failed to load networks</Alert>}
      
      {!isLoading && !error && (
        <>
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {numSelected > 0 ? `${numSelected} selected` : `${rowCount} networks`}
            </Typography>
            <Stack direction="row" spacing={1}>
              {numSelected > 0 && (
                <Tooltip title="Remove selected">
                  <IconButton onClick={handleBulkRemove}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Prune unused networks">
                <IconButton onClick={handlePruneNetworks}>
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
            <Alert severity="warning">No networks found.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={numSelected > 0 && numSelected < selectableNetworks.length}
                        checked={selectableNetworks.length > 0 && numSelected === selectableNetworks.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Network Name</TableCell>
                    <TableCell>Network ID</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {networks.map((network) => {
                    const isItemSelected = isSelected(network.Id)
                    const isSystemNet = isSystemNetwork(network)
                    
                    return (
                      <TableRow
                        key={network.Id}
                        hover
                        onClick={isSystemNet ? undefined : () => handleSelectOne(network.Id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: isSystemNet ? 'default' : 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox 
                            checked={isItemSelected} 
                            disabled={isSystemNet}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <NetworkIcon color="action" />
                            <span>{network.Name}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <code>{network.Id.slice(0, 12)}</code>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={network.Driver}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{network.Scope}</TableCell>
                        <TableCell>
                          <Chip
                            label={getNetworkType(network)}
                            size="small"
                            color={getNetworkTypeColor(network) as any}
                          />
                        </TableCell>
                        <TableCell>{formatDate(network.Created)}</TableCell>
                        <TableCell>
                          {!isSystemNet && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMenuOpen(e, network.Id)
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          )}
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
        <MenuItem onClick={() => handleRemoveNetwork(menuNetworkId)}>
          <DeleteIcon sx={{ mr: 1 }} /> Remove
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
            disabled={removeNetworkMutation.isPending || pruneNetworksMutation.isPending}
          >
            {removeNetworkMutation.isPending || pruneNetworksMutation.isPending ? (
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

export default NetworksPage
