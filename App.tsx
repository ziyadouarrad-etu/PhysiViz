import React, { useState, useRef } from 'react';
import { Upload, Loader2, RefreshCw, Eye, BrainCircuit, MessageSquare, ArrowRight } from 'lucide-react';
import { PhysicsScene } from './types';
import { analyzePhysicsImage, analyzePhysicsPrompt } from './services/geminiService';
import { SceneViewer } from './components/SceneViewer';
import { InfoPanel } from './components/InfoPanel';
import { ChatInterface } from './components/ChatInterface';

const App: React.FC = () => {
  const [sceneData, setSceneData] = useState<PhysicsScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    setLoading(true);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const data = await analyzePhysicsImage(file);
      setSceneData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please ensure it is a clear physics diagram and try again.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePromptSubmit = async () => {
      if (!promptInput.trim()) return;

      resetState();
      setLoading(true);

      try {
        const data = await analyzePhysicsPrompt(promptInput);
        setSceneData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to generate scene from description. Please try a different prompt.");
      } finally {
        setLoading(false);
      }
  };

  const resetState = () => {
      setSceneData(null);
      setError(null);
      setImagePreview(null);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white font-sans">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            PhysiViz
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {sceneData && (
              <button 
                onClick={() => { resetState(); setPromptInput(''); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 rounded-md hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                New Problem
              </button>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Persistent Hidden Input */}
        <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
        />

        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-blue-200 animate-pulse">Computing Physics Scene...</p>
                <p className="text-sm text-slate-400 mt-2">Analyzing geometry and forces</p>
            </div>
        )}

        {/* Empty State / Input Area */}
        {!sceneData && !loading && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-5xl font-extrabold text-white tracking-tight">
                        Visualize Physics <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Instantly</span>
                    </h2>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto">
                        Turn images or text descriptions into interactive 3D visualizations with extracted physical properties.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-stretch">
                    {/* Option 1: Image Upload */}
                    <div 
                        onClick={triggerUpload}
                        className="group relative border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-2xl p-8 transition-all cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 flex flex-col items-center justify-center gap-6 h-64"
                    >
                        <div className="p-4 bg-slate-700/50 group-hover:bg-blue-600/20 rounded-full transition-colors">
                            <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-white mb-2">Upload Image</h3>
                            <p className="text-sm text-slate-500 group-hover:text-slate-400">
                                Diagrams, textbook photos, or sketches
                            </p>
                        </div>
                    </div>

                    {/* Option 2: Text Prompt */}
                    <div className="relative border-2 border-slate-700 rounded-2xl p-8 bg-slate-800/30 flex flex-col h-64">
                         <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            <h3 className="text-xl font-semibold text-white">Describe Scenario</h3>
                         </div>
                         <textarea 
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            placeholder="e.g. A red 5kg block sitting on a 30-degree inclined plane..."
                            className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                         />
                         <button 
                            onClick={handlePromptSubmit}
                            disabled={!promptInput.trim()}
                            className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                         >
                            <span>Generate 3D Scene</span>
                            <ArrowRight className="w-4 h-4" />
                         </button>
                    </div>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}
            </div>
          </div>
        )}

        {/* Visualization Layout */}
        {sceneData && (
          <div className="flex w-full h-full">
            {/* Left: 3D Scene */}
            <div className="flex-1 relative bg-slate-950">
               <SceneViewer sceneData={sceneData} />
               
               {/* Overlay: Image Preview OR Prompt Text */}
               {imagePreview ? (
                   <div className="absolute bottom-4 left-4 w-32 h-auto rounded-lg overflow-hidden border-2 border-slate-600 shadow-xl opacity-80 hover:opacity-100 transition-opacity bg-slate-900">
                       <img src={imagePreview} alt="Original" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                           <span className="text-[10px] text-white font-medium flex items-center gap-1 uppercase tracking-wider">
                               <Eye className="w-3 h-3" /> Source
                           </span>
                       </div>
                   </div>
               ) : promptInput && (
                   <div className="absolute bottom-4 left-4 max-w-sm rounded-lg overflow-hidden border border-slate-600 shadow-xl bg-slate-900/90 backdrop-blur-md p-4">
                       <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                           <MessageSquare className="w-3 h-3" /> Prompt
                       </div>
                       <p className="text-sm text-slate-200 italic leading-relaxed">"{promptInput}"</p>
                   </div>
               )}

               {/* Chat Interface */}
               <ChatInterface sceneData={sceneData} />
            </div>

            {/* Right: Data Panel */}
            <div className="w-96 flex-none border-l border-slate-700 shadow-2xl z-10">
              <InfoPanel data={sceneData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;