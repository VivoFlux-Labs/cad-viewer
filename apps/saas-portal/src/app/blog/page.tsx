'use client';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BlogPage() {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog').then(res => res.json()).then(data => {
      setContent(data.content);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/blog', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' }
    });
    setIsEditing(false);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-950">
      <div className="animate-pulse text-blue-500 font-bold text-xl tracking-widest">LOADING BLOG...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Header Panel */}
      <div className="bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-black tracking-tight text-white">
          <span className="text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text">Doc Sigma's</span> Presentation UI
        </h1>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-6 py-2 rounded-lg font-bold text-sm shadow transition-all ${
            isEditing 
            ? 'bg-green-600 hover:bg-green-500 text-white' 
            : 'bg-white hover:bg-gray-100 text-black'
          }`}
        >
          {isEditing ? '✔ Save Markdown' : '✎ Edit Document'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto mt-12 px-6">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[700px] bg-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm leading-relaxed border border-gray-700 shadow-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            spellCheck={false}
          />
        ) : (
          <div className="p-10 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
            {/* The Prose class invokes the tailwindcss/typography plugin to make markdown extremely readable automatically */}
            <div className="prose prose-invert prose-indigo prose-img:rounded-xl prose-a:text-blue-400 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
