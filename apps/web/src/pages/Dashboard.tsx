import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
  ViewInAr,
  Image,
  Storage,
  DeviceHub,
  PlayArrow,
  Stop,
} from '@mui/icons-material'
import { useSystemInfo, useSystemDf, useContainers, useImages, useVolumes, useNetworks } from '../lib/hooks'

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary' 
}: { 
  title: string
  value: number | string
  icon: React.ElementType
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Icon color={color} sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const { data: systemInfo, isLoading: systemInfoLoading, error: systemInfoError } = useSystemInfo()
  const { data: systemDf, isLoading: systemDfLoading, error: systemDfError } = useSystemDf()
  const { data: containers } = useContainers({ all: true })
  const { data: images } = useImages()
  const { data: volumes } = useVolumes()
  const { data: networks } = useNetworks()

  if (systemInfoLoading || systemDfLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (systemInfoError || systemDfError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load system information. Please check if Docker is running and accessible.
      </Alert>
    )
  }

  const dockerInfo = systemInfo?.data
  const diskUsage = systemDf?.data
  const containerList = containers?.data || []
  const imageList = images?.data || []
  const volumeList = volumes?.data?.Volumes || []
  const networkList = networks?.data || []

  const runningContainers = containerList.filter((c: any) => c.State === 'running').length
  const stoppedContainers = containerList.filter((c: any) => c.State === 'exited').length

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Docker Dashboard
      </Typography>

      {dockerInfo && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Docker Version
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dockerInfo.ServerVersion}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Operating System
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dockerInfo.OperatingSystem}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        Resource Overview
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Running Containers"
            value={runningContainers}
            icon={PlayArrow}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stopped Containers"
            value={stoppedContainers}
            icon={Stop}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Images"
            value={imageList.length}
            icon={Image}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Volumes"
            value={volumeList.length}
            icon={Storage}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Containers:</Typography>
                  <Chip label={containerList.length} color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Images:</Typography>
                  <Chip label={imageList.length} color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Volumes:</Typography>
                  <Chip label={volumeList.length} color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Networks:</Typography>
                  <Chip label={networkList.length} color="primary" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {diskUsage && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Disk Usage
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Build Cache:</Typography>
                    <Chip 
                      label={`${(diskUsage.BuildCache?.reduce((acc: number, item: any) => acc + item.Size, 0) / 1024 / 1024 / 1024).toFixed(2)} GB`} 
                      color="secondary" 
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Layers:</Typography>
                    <Chip 
                      label={`${(diskUsage.LayersSize / 1024 / 1024 / 1024).toFixed(2)} GB`} 
                      color="secondary" 
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardPage
