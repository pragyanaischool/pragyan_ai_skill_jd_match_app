import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- ICONS (normally from 'lucide-react') ---
// In a real project: import { UploadCloud, FileText, Link, Trash2, ... } from 'lucide-react';
// For this single-file setup, we'll create simple SVG components.
const Icon = ({ path, className = "w-6 h-6 inline-block" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);
const UploadCloud = () => <Icon path="M20 16.2A4.5 4.5 0 0 0 15.5 8H14a6 6 0 0 0-12 0H1.5A4.5 4.5 0 0 0 6 16.2" />;
const FileText = () => <Icon path="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4" />;
const LinkIcon = () => <Icon path="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />;
const Trash2 = () => <Icon path="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" />;
const Bot = () => <Icon path="M12 8V4H8 M16 8h-4 M12 14v-2 M12 8a2 2 0 1 0 4 0v0a2 2 0 1 0-4 0v0Z M14 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M12 18H6 M18 18h-2 M12 8a2 2 0 1 0 4 0v0a2 2 0 1 0-4 0Z M12 18a6 6 0 0 0 6-6v-2a6 6 0 0 0-6-6H6a6 6 0 0 0-6 6v2a6 6 0 0 0 6 6Z" />;
const User = () => <Icon path="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 11A4 4 0 1 0 12 3 4 4 0 0 0 12 11z" />;
const ChevronDown = () => <Icon path="m6 9 6 6 6-6" className="w-4 h-4 group-open:rotate-180 transition-transform" />;
const AlertTriangle = () => <Icon path="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z M12 9v4 M12 17h.01" />;
const Send = () => <Icon path="m22 2-7 20-4-9-9-4Z M22 2l-11 11" className="w-5 h-5"/>;

// --- API CLIENT ---
// Use the actual API client for fetching data from your backend.
// Replace `API_URL` with your deployed Render URL.
const API_URL = "http://localhost:8000"; // For local development

const apiClient = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || `API Error: ${response.statusText}`);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
      }
      // Handle cases where the response might be empty (e.g., a 204 No Content)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      }
      return; // Return undefined for non-json responses
    } catch (error) {
      console.error(`API Client Error on ${options.method || 'GET'} ${endpoint}:`, error);
      if (error instanceof TypeError) { // This often indicates a CORS or network issue
          throw new Error(`Network Error: Failed to connect to the backend at ${API_URL}. Please ensure the server is running and there are no CORS issues.`);
      }
      throw error; // Re-throw other errors (like the ones we created)
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, body, isFormData = false) {
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const requestBody = isFormData ? body : JSON.stringify(body);
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: requestBody,
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};


// --- UI COMPONENTS ---

const Header = () => (
    <header className="bg-slate-900/95 backdrop-blur-sm text-white p-4 shadow-lg flex items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            🚀 TalentSync AI
        </h1>
    </header>
);

const TabButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 ${
            active
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
        }`}
    >
        {label}
    </button>
);

const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
    const baseClasses = "px-4 py-2 rounded-md font-semibold text-sm transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2";
    const variants = {
        primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-500 disabled:opacity-50',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
    };
    return <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>
};

const TextInput = (props) => (
    <input {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow" />
);

const TextArea = (props) => (
    <textarea {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow" />
);

// --- APP SECTIONS / TABS ---

function JDManagement({ jds, setJds }) {
    const [activeTab, setActiveTab] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);

    const addJd = async (type) => {
        try {
            let response;
            if (type === 'text') {
                response = await apiClient.post('/api/jds/text', { title, content });
            } else if (type === 'url') {
                response = await apiClient.post('/api/jds/url', { title, url });
            } else if (type === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);
                if (title) formData.append('title', title);
                response = await apiClient.post('/api/jds/file', formData, true);
            }
            setJds(prev => [response, ...prev]);
            setTitle(''); setContent(''); setUrl(''); setFile(null);
        } catch (error) {
            console.error("Failed to add JD", error);
            alert(`Error: ${error.message}`);
        }
    };

    const deleteJd = async (id) => {
        if (window.confirm("Are you sure you want to delete this JD?")) {
            try {
                await apiClient.delete(`/api/jds/${id}`);
                setJds(prev => prev.filter(jd => jd.id !== id));
            } catch (error) {
                console.error("Failed to delete JD", error);
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Card>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Add Job Description</h3>
                <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 mb-4">
                    <TabButton label="📝 Paste Text" active={activeTab === 'text'} onClick={() => setActiveTab('text')} />
                    <TabButton label="📄 Upload File" active={activeTab === 'file'} onClick={() => setActiveTab('file')} />
                    <TabButton label="🔗 From URL" active={activeTab === 'url'} onClick={() => setActiveTab('url')} />
                </div>
                <div className="space-y-4">
                     <TextInput placeholder="Job Title (e.g., Senior Python Developer)" value={title} onChange={(e) => setTitle(e.target.value)} />
                    {activeTab === 'text' && (
                        <>
                            <TextArea rows="6" placeholder="Paste the full job description here..." value={content} onChange={(e) => setContent(e.target.value)} />
                            <Button onClick={() => addJd('text')}>Save JD</Button>
                        </>
                    )}
                     {activeTab === 'file' && (
                        <div className="space-y-4">
                            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.docx,.txt" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                            <Button onClick={() => addJd('file')} disabled={!file}>Upload & Save JD</Button>
                        </div>
                    )}
                    {activeTab === 'url' && (
                        <>
                            <TextInput type="url" placeholder="https://linkedin.com/jobs/view/..." value={url} onChange={(e) => setUrl(e.target.value)} />
                            <Button onClick={() => addJd('url')}>Extract & Save JD</Button>
                        </>
                    )}
                </div>
            </Card>
            <Card>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Job Description Library ({jds.length})</h3>
                <div className="space-y-3">
                    {jds.map(jd => (
                         <details key={jd.id} className="group bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg transition hover:shadow-md">
                            <summary className="flex justify-between items-center cursor-pointer font-medium text-slate-700 dark:text-slate-200">
                                {jd.title}
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs font-mono bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">{jd.source}</span>
                                    <ChevronDown />
                                </div>
                            </summary>
                            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 space-y-4">
                                <p className="whitespace-pre-wrap leading-relaxed">{jd.content.substring(0, 400)}...</p>
                                <Button onClick={() => deleteJd(jd.id)} variant="danger"><Trash2/> Delete</Button>
                            </div>
                        </details>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function ResumeToJDsAnalysis({ jds, sessionId }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedJds, setSelectedJds] = useState([]);
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!selectedFile || selectedJds.length === 0 || !sessionId) return;
        setIsLoading(true);
        setResults(null);
        
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('resume', selectedFile);
        formData.append('jd_ids', JSON.stringify(selectedJds));

        try {
            const response = await apiClient.post('/api/analyze/resume-to-jds', formData, true);
            setResults(response);
        } catch(e) {
            console.error("Analysis failed", e);
            alert(`Analysis Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleJdSelection = (jdId) => {
        setSelectedJds(prev => 
            prev.includes(jdId) ? prev.filter(id => id !== jdId) : [...prev, jdId]
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-2 space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">1. Upload Resume</h3>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                        <FileText />
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedFile ? selectedFile.name : 'Upload a PDF or DOCX file'}</p>
                        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} accept=".pdf,.docx" className="mt-2 text-sm" />
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">2. Select Job Descriptions</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md">
                        {jds.map(jd => (
                            <div key={jd.id} className="flex items-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                <input type="checkbox" id={`jd-${jd.id}`} checked={selectedJds.includes(jd.id)} onChange={() => toggleJdSelection(jd.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                <label htmlFor={`jd-${jd.id}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">{jd.title}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <Button onClick={handleAnalyze} disabled={isLoading || !selectedFile || selectedJds.length === 0} className="w-full">
                    {isLoading ? 'Analyzing...' : `Analyze Resume vs ${selectedJds.length} JDs`}
                </Button>
            </Card>
            
            <Card className="lg:col-span-3">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Analysis Results</h3>
                {isLoading && <div className="text-center p-8"><p>Analyzing... please wait.</p></div>}
                {results && (
                     <div className="space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-slate-800 dark:text-white">Candidate: {results.resume_info.Name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{results.resume_info.Filename}</p>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">Matching Jobs:</h4>
                        <div className="space-y-2">
                        {results.matches.map(match => (
                            <div key={match.jd_id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800/80">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{match.jd_title}</span>
                                    <span className="text-xl font-bold text-green-500">{match.similarity_score}</span>
                                </div>
                                <p className="text-sm text-purple-500 font-semibold">{match.recommendation}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                 {!isLoading && !results && <div className="text-center p-8 text-slate-500">Results will be displayed here after analysis.</div>}
            </Card>
        </div>
    );
}

function AIChat({sessionId}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;
        
        const newMessages = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/chat', { session_id: sessionId, question: input, mode: 'multi-candidate' }); // mode is hardcoded for now
            setMessages([...newMessages, { sender: 'ai', text: response.answer }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages([...newMessages, { sender: 'ai', text: 'Sorry, I encountered an error.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="h-[75vh] flex flex-col max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">AI Assistant</h3>
            <div className="flex-grow overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-4 mb-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-full ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-600'} text-white`}>
                           {msg.sender === 'user' ? <User /> : <Bot />}
                        </div>
                        <div className={`p-3 rounded-lg max-w-lg shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                           {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-center text-slate-500">AI is thinking...</div>}
            </div>
            <div className="flex space-x-2">
                <TextInput 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about candidates, JDs, or career paths..." 
                    className="flex-grow"
                />
                <Button onClick={sendMessage} disabled={isLoading}><Send /></Button>
            </div>
        </Card>
    );
}

// --- MAIN APP COMPONENT ---

export default function App() {
    const [activeTab, setActiveTab] = useState('jd-management');
    const [sessionId, setSessionId] = useState(null);
    const [jds, setJds] = useState([]);
    const [error, setError] = useState(null);
    
    const TABS = {
        'jd-management': { label: '📋 JD Management', component: <JDManagement jds={jds} setJds={setJds} /> },
        'resume-to-jds': { label: '📊 Resume → JDs', component: <ResumeToJDsAnalysis jds={jds} sessionId={sessionId} /> },
        'jds-to-resumes': { label: '📄 JDs → Resumes', component: <Card><p>Content for this tab is coming soon!</p></Card> },
        'interview': { label: '💬 Interview', component: <Card><p>Content for this tab is coming soon!</p></Card> },
        'ai-chat': { label: '🤖 AI Assistant', component: <AIChat sessionId={sessionId} /> },
    };

    // Initialize session and fetch data on mount
    useEffect(() => {
        const initialize = async () => {
            try {
                const sessionResponse = await apiClient.post('/api/session');
                if (sessionResponse.success) {
                    setSessionId(sessionResponse.session_id);
                } else {
                    throw new Error("Session creation failed.");
                }

                const jdsResponse = await apiClient.get('/api/jds');
                setJds(jdsResponse.reverse());
            } catch (err) {
                console.error("Initialization failed:", err);
                setError(err.message);
            }
        };
        initialize();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl max-w-fit mx-auto">
                        {Object.keys(TABS).map(tabKey => (
                            <TabButton
                                key={tabKey}
                                label={TABS[tabKey].label}
                                active={activeTab === tabKey}
                                onClick={() => setActiveTab(tabKey)}
                            />
                        ))}
                    </div>
                </div>

                {error ? (
                    <Card className="max-w-2xl mx-auto">
                        <div className="flex flex-col items-center text-center text-red-500">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <h2 className="text-xl font-bold">Connection Error</h2>
                            <p>{error}</p>
                        </div>
                    </Card>
                ) : !sessionId ? (
                     <Card className="max-w-md mx-auto">
                        <p className="text-center animate-pulse">Initializing session with the backend...</p>
                    </Card>
                ) : (
                    <div>
                       {TABS[activeTab].component}
                    </div>
                )}
            </main>
        </div>
    );
}

