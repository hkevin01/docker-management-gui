import { Routes, Route } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material'
import { Dashboard, ViewInAr, Image, Storage, DeviceHub, Settings, Terminal } from '@mui/icons-material'
import DashboardPage from './pages/Dashboard'
import ContainersPage from './pages/Containers'
import ImagesPage from './pages/Images'
import VolumesPage from './pages/Volumes'
import NetworksPage from './pages/Networks'
import SettingsPage from './pages/Settings'
import LogsViewerPage from './pages/LogsViewer'

const drawerWidth = 240

const menuItems = [
  { path: '/', label: 'Dashboard', icon: Dashboard },
  { path: '/containers', label: 'Containers', icon: ViewInAr },
  { path: '/images', label: 'Images', icon: Image },
  { path: '/volumes', label: 'Volumes', icon: Storage },
  { path: '/networks', label: 'Networks', icon: DeviceHub },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/logs', label: 'Logs (WS)', icon: Terminal },
]

function App() {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'primary.main',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Docker Management GUI
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: theme.palette.grey[50],
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            🐳 Docker GUI
          </Typography>
        </Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component="a"
                href={item.path}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          mt: 8,
        }}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/images" element={<ImagesPage />} />
          <Route path="/volumes" element={<VolumesPage />} />
          <Route path="/networks" element={<NetworksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logs" element={<LogsViewerPage />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default App
