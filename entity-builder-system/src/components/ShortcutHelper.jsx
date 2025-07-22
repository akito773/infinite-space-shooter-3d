import React, { useState } from 'react';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

function ShortcutHelper() {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <>
      <button
        className="help-button"
        onClick={() => setShowHelp(!showHelp)}
        title="Keyboard Shortcuts"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#0066cc',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        ?
      </button>
      
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '250px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1001,
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
            Keyboard Shortcuts
          </h3>
          
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <tr key={index}>
                  <td style={{ 
                    padding: '4px 10px 4px 0', 
                    color: '#00ccff',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    {shortcut.key}
                  </td>
                  <td style={{ padding: '4px 0', color: '#ccc' }}>
                    {shortcut.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ShortcutHelper;