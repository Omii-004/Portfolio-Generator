import { useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Download, ArrowLeft, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const browserRef = useRef(null);
  const { token } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  const portfolioId = location.state?.portfolioId || id;

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // The endpoint is authenticated, and an iframe src / window.open cannot send an
  // Authorization header - so fetch it here and hand the markup to the frame.
  useEffect(() => {
    if (!portfolioId) return;
    axios.get(`${API}/api/portfolio/preview/${portfolioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setHtml(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load this portfolio.'));
  }, [portfolioId, token]);

  // If there's no portfolio ID, send them back to upload
  if (!portfolioId) {
    return <Navigate to="/upload" replace />;
  }

  const handleDownload = async () => {
    const res = await axios.get(`${API}/api/portfolio/download/${portfolioId}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${portfolioId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      browserRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex-grow flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full h-full">

      {/* Header & Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Your Portfolio is Ready!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Preview how your site looks on desktop.</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Home
          </button>

          <button
            onClick={handleDownload}
            className="bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Download className="h-5 w-5" /> Download Source Code
          </button>
        </div>
      </div>

      {/* The Fake Browser Window (for aesthetic points!) */}
      <div ref={browserRef} className="flex-grow bg-gray-200 dark:bg-gray-800 rounded-t-xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col shadow-2xl mt-4 [&:fullscreen]:rounded-none [&:fullscreen]:border-0" style={{ minHeight: '600px' }}>

        <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-3 flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-center text-xs text-gray-500 py-1 flex items-center justify-center gap-2 font-mono">
            <ExternalLink className="h-3 w-3" /> https://your-name.portfoli.ai
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'View in full screen'}
            className="p-2 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isFullscreen
              ? <Minimize2 className="h-4 w-4" />
              : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* The Actual Preview iframe */}
        {error ? (
          <p className="flex-grow flex items-center justify-center bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 p-8 text-center">
            {error}
          </p>
        ) : (
          <iframe
            srcDoc={html}
            className="w-full h-full bg-white flex-grow"
            title="Portfolio Preview"
          ></iframe>
        )}

      </div>
    </div>
  );
}
