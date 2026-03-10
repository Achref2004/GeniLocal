import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './reutilisable/Themecontext'; // ← import
import { AnimatedRoutes } from './components/AnimatedRoutes';

function App() {
  return (
    <BrowserRouter>
     <ThemeProvider>
       <AnimatedRoutes />
     </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;