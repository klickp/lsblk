/**
 * Square Payment Integration Component
 */
import { useState } from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import ENV from '../../utils/constants';

export default function SquareConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const generateRandomState = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const initiateSquareOAuth = () => {
    if (!ENV.SQUARE_APP_ID) {
      setError('Square App ID not configured');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const state = generateRandomState();
    sessionStorage.setItem('square_oauth_state', state);

    const params = new URLSearchParams({
      client_id: ENV.SQUARE_APP_ID,
      scope: 'MERCHANT_PROFILE_READ PAYMENTS_READ ORDERS_READ',
      session: 'false',
      state: state
    });

    // Open Square OAuth in new window
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const authWindow = window.open(
      `https://connect.squareup.com/oauth2/authorize?${params}`,
      'square-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for callback
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'square-oauth-success') {
        const { code, state: returnedState } = event.data;
        
        // Verify state to prevent CSRF
        const storedState = sessionStorage.getItem('square_oauth_state');
        if (returnedState !== storedState) {
          setError('Invalid OAuth state');
          setIsLoading(false);
          return;
        }

        try {
          // Exchange code for access token
          const response = await fetch(`${ENV.API_URL}/api/square/connect`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ code })
          });

          if (response.ok) {
            setIsConnected(true);
            setShowModal(false);
            setError(null);
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Connection failed');
          }
        } catch (err) {
          setError('Failed to connect to Square');
          console.error('Square connection error:', err);
        } finally {
          setIsLoading(false);
          sessionStorage.removeItem('square_oauth_state');
        }
      } else if (event.data.type === 'square-oauth-error') {
        setError(event.data.error || 'OAuth failed');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup listener after timeout
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      if (isLoading) {
        setIsLoading(false);
      }
    }, 300000); // 5 minutes timeout
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('pizza_auth_token');
    return token ? { 'Authorization': `Bearer ${atob(token)}` } : {};
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
          isConnected
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {isConnected ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Connected to Square
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            Connect Square
          </>
        )}
      </button>

      {/* Connection Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in"
          onClick={() => !isLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Connect to Square</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Connect your Square account to sync payment data and manage transactions directly from your dashboard.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Real-time payment synchronization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Unified order and payment tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Advanced financial analytics</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={initiateSquareOAuth}
                disabled={isLoading}
                className="flex-1 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Continue to Square'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
