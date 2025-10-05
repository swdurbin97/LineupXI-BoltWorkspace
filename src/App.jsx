import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import FormationsPage from './pages/tactics/Formations'
import FormationDetail from './pages/tactics/FormationDetail'
import TeamsheetsPage from './pages/teamsheets'
import LineupPage from './pages/lineup'
import SavedLineupsPage from './pages/saved'

export default function App() {
  const link = "px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800";
  const active = "font-semibold underline";
  return (
    <BrowserRouter>
      <div className="border-b">
        <nav className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-2">
          <NavLink to="/teamsheets" className={({isActive}) => `${link} ${isActive ? active : ''}`}>Teamsheets</NavLink>
          <NavLink to="/lineup" className={({isActive}) => `${link} ${isActive ? active : ''}`}>Lineup</NavLink>
          <NavLink to="/saved" className={({isActive}) => `${link} ${isActive ? active : ''}`}>Saved Lineups</NavLink>
          <NavLink to="/tactics/formations" className={({isActive}) => `${link} ${isActive ? active : ''}`}>Tactics</NavLink>
        </nav>
      </div>
      <Routes>
        <Route path="/" element={<TeamsheetsPage />} />
        <Route path="/teamsheets" element={<TeamsheetsPage />} />
        <Route path="/lineup" element={<LineupPage />} />
        <Route path="/saved" element={<SavedLineupsPage />} />
        <Route path="/tactics/formations" element={<FormationsPage />} />
        <Route path="/tactics/formations/:code" element={<FormationDetail />} />
      </Routes>
    </BrowserRouter>
  )
}