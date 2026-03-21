import React from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Whiteboard from './pages/Whiteboard'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Signup from './pages/Signup'
import LandingPage from './pages/LandingPage'
import MeetingPage from './pages/MeetingPage'

function App() {
  return (
    <React.Fragment>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/login' element={<Login />} />
          <Route path='/Signup' element={<Signup />} />
          <Route path='/whiteboard' element={<Whiteboard />} />
          <Route path='/meet/:meetingId' element={<MeetingPage />} />
        </Routes>
      </BrowserRouter>
    </React.Fragment>
  )
}

export default App
