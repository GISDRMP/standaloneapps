import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ReactFlowProvider } from 'reactflow';
import App from './App';
import { appTheme } from './theme';
import './styles.css';
import 'reactflow/dist/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </ThemeProvider>,
);
