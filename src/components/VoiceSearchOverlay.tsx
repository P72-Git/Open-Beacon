import { useState, useEffect } from 'react';
import { Mic, X, Navigation, Phone, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processVoiceTextQuery } from '../services/geminiService';
import { useLocationContext } from '../context/LocationContext';
import { PlaceResult } from '../types';
import { useNavigate } from 'react-router-dom';

export default function VoiceSearchOverlay({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<{ responseText: string, places: PlaceResult[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const { lat, lng } = useLocationContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      setResponse(null);
      setTranscript('');
    }
  }, [isOpen]);

  const startListening = () => {
    setIsListening(true);
    setTranscript('Listening...');
    // Mocking voice recognition for now
    setTimeout(() => {
      setTranscript('Find the best urgent care open now');
      setIsListening(false);
      handleVoiceQuery('Find the best urgent care open now');
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleVoiceQuery = async (query: string) => {
    if (!lat || !lng) return;
    setLoading(true);
    // In a real app, we'd pass the audio blob. Here we mock it with text for simplicity.
    // We'll just use searchPlaces and generate a spoken response.
    const res = await processVoiceTextQuery(query, lat, lng);
    setResponse(res);
    setLoading(false);
    
    // Speak the response
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(res.responseText);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-4"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>

          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 flex flex-col items-center text-center">
              <motion.div
                animate={isListening ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isListening ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Mic size={40} />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{transcript}</h2>
              
              {loading && <p className="text-gray-500 animate-pulse">Finding the best options...</p>}
              
              {response && (
                <div className="mt-4 text-left w-full">
                  <p className="text-lg text-gray-700 mb-6 text-center">{response.responseText}</p>
                  
                  {response.places.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                      <h3 className="font-bold text-gray-900">{response.places[0].name}</h3>
                      <p className="text-sm text-gray-500">{response.places[0].distanceMiles.toFixed(1)} mi • {response.places[0].openStatusText}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        onClose();
                        if (response.places[0]) {
                          window.open(`https://maps.google.com/?q=${response.places[0].lat},${response.places[0].lng}`);
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition-colors"
                    >
                      <Navigation size={24} />
                      Directions
                    </button>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate(`/search?q=${encodeURIComponent(transcript)}`);
                      }}
                      className="flex flex-col items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-medium transition-colors"
                    >
                      <MoreHorizontal size={24} />
                      More Options
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
