import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Menu from './pages/Menu.jsx'
import Orders from './pages/Orders.jsx'
import AdminItems from './pages/admin/Items.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import AdminRoles from './pages/admin/Roles.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function RequireAdmin({ children }){
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user')||'null')
  if(!token) return <Navigate to="/login" />
  return (user?.role?.toLowerCase() === 'admin') ? children : <Navigate to="/" />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Menu /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
  <Route path="/admin" element={<Navigate to="/admin/items" />} />
  <Route path="/admin/items" element={<RequireAdmin><AdminItems /></RequireAdmin>} />
  <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
  <Route path="/admin/roles" element={<RequireAdmin><AdminRoles /></RequireAdmin>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
