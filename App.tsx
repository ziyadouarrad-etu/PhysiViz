import React, { useState, useRef } from 'react';
import { Upload, Loader2, RefreshCw, Eye, BrainCircuit } from 'lucide-react';
import { PhysicsScene } from './types';
import { analyzePhysicsImage } from './services/geminiService';
import { SceneViewer } from './components/SceneViewer';
import { InfoPanel } from './components/InfoPanel';

const App: React.FC = () => {
  const [sceneData, setSceneData] = useState<PhysicsScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setSceneData(null);
    setError(null);
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
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
                onClick={triggerUpload}
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
        {/* Persistent Hidden Input - Moved outside conditional blocks */}
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
                <p className="text-lg font-medium text-blue-200 animate-pulse">Analyzing Physics Scene...</p>
                <p className="text-sm text-slate-400 mt-2">Identifying forces, objects, and geometry</p>
            </div>
        )}

        {/* Empty State / Upload Area */}
        {!sceneData && !loading && (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <h2 className="text-4xl font-extrabold text-white">
                        Visualize Physics Problems <br/>
                        <span className="text-blue-500">Instantly</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Upload a photo or diagram of a physics problem. We'll use AI to reconstruct it in 3D and extract the variables.
                    </p>
                </div>

                <div 
                    onClick={triggerUpload}
                    className="group relative border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-3xl p-12 transition-all cursor-pointer bg-slate-800/30 hover:bg-slate-800/60"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-700 group-hover:bg-blue-600 rounded-full transition-colors shadow-xl">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                                Click to Upload or Drag & Drop
                            </p>
                            <p className="text-sm text-slate-500">
                                Supports JPG, PNG, WEBP
                            </p>
                        </div>
                    </div>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
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
               
               {/* Overlay: Image Preview (Mini map style) */}
               {imagePreview && (
                   <div className="absolute bottom-4 left-4 w-32 h-auto rounded-lg overflow-hidden border-2 border-slate-600 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
                       <img src={imagePreview} alt="Original" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                           <span className="text-xs text-white font-medium flex items-center gap-1">
                               <Eye className="w-3 h-3" /> Source
                           </span>
                       </div>
                   </div>
               )}
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