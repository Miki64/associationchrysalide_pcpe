import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { BudgetProvider } from './context/BudgetContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Usagers from './pages/Usagers';
import Calendrier from './pages/Calendrier';
import Admin from './pages/Admin';

function App() {
  return (
    <BudgetProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="usagers" element={<Usagers />} />
            <Route path="calendrier" element={<Calendrier />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </HashRouter>
    </BudgetProvider>
  );
}

export default App;
