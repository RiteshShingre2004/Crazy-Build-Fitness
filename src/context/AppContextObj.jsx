import { createContext } from 'react';

// Exported separately so Fast Refresh can handle AppContext.jsx properly
const AppContext = createContext(null);
export default AppContext;
