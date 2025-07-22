import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Provider } from 'react-redux';
import { store } from './store';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import ShortcutHelper from './components/ShortcutHelper';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './App.css';

function AppContent() {
  useKeyboardShortcuts();
  
  return (
    <div className="app">
        <div className="header">
          <h1>Entity Builder - 3D Prototype Tool</h1>
        </div>
        
        <div className="main-content">
          <Toolbar />
          
          <div className="viewport">
            <Canvas
              camera={{ position: [5, 5, 5], fov: 50 }}
              shadows
            >
              <Environment preset="studio" />
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              
              <Grid
                args={[20, 20]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#6f6f6f"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#9d9d9d"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
              />
              
              <Scene />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
              />
            </Canvas>
          </div>
          
          <PropertiesPanel />
        </div>
        
        <ShortcutHelper />
      </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;