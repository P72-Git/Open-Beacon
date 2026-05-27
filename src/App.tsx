/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import PlaceDetail from './pages/PlaceDetail';
import Saved from './pages/Saved';
import Explore from './pages/Explore';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="place/:id" element={<PlaceDetail />} />
          <Route path="saved" element={<Saved />} />
          <Route path="explore" element={<Explore />} />
        </Route>
      </Routes>
    </Router>
  );
}
