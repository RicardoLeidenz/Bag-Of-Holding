// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Character } from "./pages/Character";
import { SpellList } from "./pages/SpellList";
import { CharacterCreator } from "./pages/CharacterCreator";
import { EquipmentDisplay } from "./components/Equipment.jsx";
import { CharacterSelection } from "./pages/CharacterSelection.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";


export const router = createBrowserRouter(
  createRoutesFromElements(
    // Root Route: every page shares the Layout (navbar + footer)
    <Route path="/" element={<Layout />} errorElement={<NotFound />} >

      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Home />} />
      <Route path="/spells" element={<SpellList />} />
      <Route path="/equipment" element={<EquipmentDisplay />} />

      {/* Pages that need a logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/characterselection" element={<CharacterSelection />} />
        <Route path="/charactercreator" element={<CharacterCreator />} />
        <Route path="/character/:id" element={<Character />} />
        <Route path="/character" element={<Navigate to="/characterselection" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);
