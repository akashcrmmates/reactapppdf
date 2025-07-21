import React, { useEffect, useRef, useState } from 'react';

export default function TemplateEditor({ onExport, mergeTags = {}, projectId = 1234 }) {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [pageSize, setPageSize] = useState("A4");
  const [pageBorder, setPageBorder] = useState(20);
  const [tableBorder, setTableBorder] = useState(1);
  const [enableStriped, setEnableStriped] = useState(true);
  const [enableHover, setEnableHover] = useState(true);
  const [textAlign, setTextAlign] = useState("left");

  useEffect(() => {
    if (!window.unlayer) {
      console.error("Unlayer editor script not loaded!");
      return;
    }

    const initEditor = () => {
      window.unlayer.init({
        id: 'editor',
        projectId,
        displayMode: 'email',
        features: {
          stockImages: true,
        },
        mergeTags,
        appearance: {
          canvasWidth: 595,
          canvasHeight: 842,
          theme: 'light',
        },
      });

      const editorDiv = document.getElementById('editor');
      if (editorDiv) {
        editorDiv.style.border = `${tableBorder}px solid black`;
        editorDiv.style.boxSizing = 'border-box';
      }

      setIsEditorReady(true);
      editorRef.current._initialized = true;
    };

    if (editorRef.current && !editorRef.current._initialized) {
      initEditor();
    } else {
      window.unlayer.setMergeTags(mergeTags);
    }
  }, [mergeTags, projectId, tableBorder]);

  const exportHtml = async () => {
    try {
      if (!isEditorReady) {
        throw new Error("Editor not initialized");
      }

      window.unlayer.exportHtml(({ design, html }) => {
        const tableStyles = `
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
              border: ${tableBorder}px solid black;
            }
            td, th {
              border: ${tableBorder}px solid black;
              padding: 8px;
              text-align: ${textAlign};
            }
            ${enableStriped ? `tr:nth-child(even) { background-color: #f9f9f9; }` : ''}
            ${enableHover ? `tr:hover { background-color: #e0e0e0; }` : ''}
          </style>
        `;

        const pageWidth = pageSize === 'A4' ? '210mm' : pageSize === 'Letter' ? '216mm' : '216mm';
        const pageHeight = pageSize === 'A4' ? '297mm' : pageSize === 'Letter' ? '279mm' : '356mm';

        const wrappedHtml = `
          <div style="width: ${pageWidth}; min-height: ${pageHeight}; padding: ${pageBorder}px; border: 1px solid black; box-sizing: border-box;">
            ${html}
          </div>
        `;

        const finalHtml = wrappedHtml.replace('</head>', `${tableStyles}</head>`);

        onExport({
          design,
          html: finalHtml,
          settings: {
            pageSize,
            pageBorder,
            tableBorder,
            enableStriped,
            enableHover,
            textAlign
          }
        });
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export template");
    }
  };

  return (
    <div>
      <div id="editor" style={{ height: '600px' }} ref={editorRef}></div>

      <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #ccc' }}>
  {/* Page & Table Settings */}
  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
    <div>
      <label htmlFor="pageSize">Page Size:</label><br />
      <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
        <option value="A4">A4</option>
        <option value="Letter">Letter</option>
        <option value="Legal">Legal</option>
      </select>
    </div>

    <div>
      <label htmlFor="pageBorder">Page Border (px):</label><br />
      <input
        id="pageBorder"
        type="number"
        value={pageBorder}
        onChange={(e) => setPageBorder(Number(e.target.value))}
        min="0"
        max="100"
        style={{ width: '80px' }}
      />
    </div>

    <div>
      <label htmlFor="tableBorder">Table Border (px):</label><br />
      <input
        id="tableBorder"
        type="number"
        value={tableBorder}
        onChange={(e) => {
          const newBorder = Number(e.target.value);
          setTableBorder(newBorder);
          const editorDiv = document.getElementById('editor');
          if (editorDiv) editorDiv.style.border = `${newBorder}px solid black`;
        }}
        min="0"
        max="10"
        style={{ width: '80px' }}
      />
    </div>

    <div>
      <label htmlFor="textAlign">Cell Align:</label><br />
      <select id="textAlign" value={textAlign} onChange={(e) => setTextAlign(e.target.value)}>
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </div>

    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={enableStriped}
        onChange={(e) => setEnableStriped(e.target.checked)}
        id="striped"
      />
      <label htmlFor="striped" style={{ marginLeft: '0.25rem' }}>Striped Rows</label>
    </div>

    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={enableHover}
        onChange={(e) => setEnableHover(e.target.checked)}
        id="hover"
      />
      <label htmlFor="hover" style={{ marginLeft: '0.25rem' }}>Hover Highlight</label>
    </div>
  </div>

  {/* Save Template Button */}
  <div>
    <button
      onClick={exportHtml}
      disabled={!isEditorReady}
      style={{
        padding: '10px 20px',
        backgroundColor: isEditorReady ? '#2d8cff' : '#cccccc',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: isEditorReady ? 'pointer' : 'not-allowed',
      }}
    >
      {isEditorReady ? 'Save Template' : 'Loading Editor...'}
    </button>
  </div>
</div>

    </div>
  );
}
