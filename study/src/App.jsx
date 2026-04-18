import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './reutilisable/Themecontext';
import { IaTaskProvider } from './context/IaTaskContext';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import GlobalSessionTracker from './components/GlobalSessionTracker';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <IaTaskProvider>
          <GlobalSessionTracker />
          <AnimatedRoutes />
        </IaTaskProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;