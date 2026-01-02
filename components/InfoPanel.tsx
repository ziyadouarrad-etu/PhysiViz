import React from 'react';
import { PhysicsScene } from '../types';
import { Box, Circle, Move, ArrowRight, Layers, Weight, Wind, Activity } from 'lucide-react';

interface InfoPanelProps {
  data: PhysicsScene;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ data }) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-800/50 backdrop-blur-md p-6 border-l border-slate-700 text-slate-100 scrollbar-thin scrollbar-thumb-slate-600">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          Scene Metadata
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <span className="text-slate-400 block text-xs uppercase tracking-wider">Type</span>
            <span className="font-semibold">{data.scene_metadata.problem_type}</span>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <span className="text-slate-400 block text-xs uppercase tracking-wider">Gravity</span>
            <span className="font-mono text-emerald-400">
              [{data.environment.gravity.join(', ')}]
            </span>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Layers className="w-5 h-5 text-blue-400" />
        Detected Objects ({data.entities.length})
      </h3>

      <div className="space-y-4">
        {data.entities.map((entity, idx) => (
          <div 
            key={idx} 
            className="group bg-slate-700/30 hover:bg-slate-700/60 transition-colors border border-slate-600 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {entity.geometry.shape === 'sphere' ? (
                  <Circle className="w-4 h-4 text-purple-400" />
                ) : (
                  <Box className="w-4 h-4 text-orange-400" />
                )}
                <span className="font-bold text-lg">{entity.name || `Object ${idx + 1}`}</span>
              </div>
              <span className="text-xs bg-slate-600 px-2 py-1 rounded-full uppercase">
                {entity.geometry.shape}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Weight className="w-3 h-3 text-slate-400" />
                <span>Mass: <span className="text-white">{entity.physics.mass} kg</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-3 h-3 text-slate-400" />
                <span>Friction: {data.environment.friction_coefficient}</span>
              </div>
              <div className="col-span-2 bg-slate-800/50 p-2 rounded flex flex-col gap-1 mt-1">
                 <div className="flex items-center gap-2 text-xs">
                    <Move className="w-3 h-3 text-blue-400" />
                    <span className="font-mono text-slate-400">Pos:</span>
                    <span className="font-mono text-white">[{entity.physics.position.map(n => n.toFixed(1)).join(', ')}]</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs">
                    <ArrowRight className="w-3 h-3 text-red-400" />
                    <span className="font-mono text-slate-400">Vel:</span>
                    <span className="font-mono text-white">[{entity.physics.velocity.map(n => n.toFixed(1)).join(', ')}]</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Raw Data Toggle (Optional, minimal view) */}
      <div className="mt-8 pt-4 border-t border-slate-700/50">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Environment Details
        </h4>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded overflow-x-auto">
            Units: {data.scene_metadata.units} <br/>
            Friction Coeff: {data.environment.friction_coefficient}
        </div>
      </div>
    </div>
  );
};
