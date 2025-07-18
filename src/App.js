import React, { useEffect, useState } from "react";
import TemplateEditor from "./TemplateEditor";

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [instanceUrl, setInstanceUrl] = useState(null);
  const [sObjects, setSObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState("");
  const [fields, setFields] = useState([]);
  const [mergeTags, setMergeTags] = useState({});

  const btnStyle = {
    padding: "10px 20px",
    backgroundColor: "#2d8cff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  };

  // Parse access token and instance URL from URL hash after login redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      const instance = params.get("instance_url");

      if (token && instance) {
        setAccessToken(token);
        setInstanceUrl(instance);
        // Clear the hash from URL so token isn't visible
        window.history.replaceState(null, null, " ");
      }
    }
  }, []);

  // Fetch all Salesforce objects after login
  useEffect(() => {
    if (accessToken && instanceUrl) {
      fetchSObjects(instanceUrl, accessToken).then((objs) => {
        const filtered = objs.filter((obj) => obj.queryable);
        setSObjects(filtered);
      });
    }
  }, [accessToken, instanceUrl]);

  // Fetch fields of selected object
  useEffect(() => {
    if (selectedObject && accessToken && instanceUrl) {
      fetchObjectFields(instanceUrl, accessToken, selectedObject).then((fields) => {
        setFields(fields);
        const tags = {};
        tags[selectedObject] = fields.map((f) => ({
          name: f.label,
          value: `{{${selectedObject}.${f.name}}}`,
        }));
        setMergeTags(tags);
      });
    }
  }, [selectedObject, accessToken, instanceUrl]);

  const saveTemplate = async ({ design, html }) => {
    const css = extractCssFromHtml(html);
    const templateName = prompt("Enter a name for your template:", "My_Template");

    if (!templateName || !selectedObject) {
      alert("Template name and object must be selected.");
      return;
    }

    try {
      const response = await fetch(`${instanceUrl}/services/apexrest/TemplateManager`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          html: html,
          css: css,
          objectName: selectedObject,
        }),
      });

      if (response.ok) {
        alert("✅ Template saved successfully to Salesforce.");
      } else {
        const err = await response.text();
        console.error("❌ Failed to save template:", err);
        alert("Error saving template.");
      }
    } catch (error) {
      console.error("⚠️ Save error:", error);
      alert("Exception occurred while saving template.");
    }
  };

  const extractCssFromHtml = (html) => {
    const match = html.match(/<style.*?>([\s\S]*?)<\/style>/i);
    return match ? match[1] : "";
  };

  // Salesforce OAuth2 Login redirect
  const handleLogin = () => {
    const clientId = "3MVG9k02hQhyUgQCN3n1EOBslis5_iJ9ApgelM2svuJz0nuQJcxp3UjQAwu_u.0IqtIbj5REa61PQM7CxyxBL";
    const redirectUri = "https://687a40f6a90e3722cff06696--reactpdfakash.netlify.app"; // <-- Update this to your actual Netlify URL after deploy!
    const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    window.location.href = loginUrl;
  };

  async function fetchSObjects(instanceUrl, accessToken) {
    const res = await fetch(`${instanceUrl}/services/data/v58.0/sobjects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.sobjects;
  }

  async function fetchObjectFields(instanceUrl, accessToken, objectName) {
    const res = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/${objectName}/describe`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.fields;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 800, margin: "auto" }}>
      {!accessToken ? (
        <button onClick={handleLogin} style={btnStyle}>
          🔐 Login with Salesforce
        </button>
      ) : (
        <>
          <h2>Select Salesforce Object:</h2>
          <select
            value={selectedObject}
            onChange={(e) => setSelectedObject(e.target.value)}
            style={{ fontSize: 16, padding: 5, marginBottom: 20, width: "100%" }}
          >
            <option value="" disabled>
              -- Choose Object --
            </option>
            {sObjects.map((obj) => (
              <option key={obj.name} value={obj.name}>
                {obj.label} ({obj.name})
              </option>
            ))}
          </select>

          {selectedObject && (
            <>
              <h3>Fields of {selectedObject} (available as merge tags)</h3>
              <ul
                style={{
                  maxHeight: 150,
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  padding: 10,
                  listStyleType: "none",
                }}
              >
                {fields.map((f) => (
                  <li key={f.name}>
                    {f.label} — <code>{`{{${selectedObject}.${f.name}}}`}</code>
                  </li>
                ))}
              </ul>

              <h2>Template Editor</h2>
              <TemplateEditor onExport={saveTemplate} mergeTags={mergeTags} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;

// GLOBAL FUNCTION — called from Salesforce to generate PDF
window.generatePdfFromSalesforce = async function (html, css, fileName = "GeneratedPDF") {
  try {
    console.log("📥 Received HTML & CSS for PDF:", html, css);

    const response = await fetch(`${process.env.REACT_APP_PDF_API_URL}/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, css }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert("❌ PDF generation failed.");
    console.error("❌ Error during PDF generation:", error);
  }
};
