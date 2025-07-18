import React, { useEffect, useRef } from 'react';

export default function TemplateEditor({ onExport, mergeTags = {} }) {
  const editorRef = useRef(null);

  useEffect(() => {
    // Wait until window.unlayer is loaded
    if (!window.unlayer) {
      console.error("Unlayer editor script not loaded!");
      return;
    }

    // Init only once if not already initialized
    if (editorRef.current && !editorRef.current._initialized) {
      window.unlayer.init({
        id: 'editor',
        projectId: 1234,  // Optional: replace or remove if not used
        displayMode: 'email',
        features: {
          stockImages: true,
        },
        mergeTags: mergeTags,
      });
      editorRef.current._initialized = true;
    } else {
      // If already initialized, update mergeTags dynamically
      window.unlayer.setMergeTags(mergeTags);
    }
  }, [mergeTags]);

  const exportHtml = () => {
    window.unlayer.exportHtml(({ design, html }) => {
      onExport({ design, html });
    });
  };

  return (
    <div>
      <div id="editor" style={{ height: '600px', border: '1px solid #ddd' }} ref={editorRef}></div>
      <button onClick={exportHtml} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#2d8cff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Save Template
      </button>
    </div>
  );
}
