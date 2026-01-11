import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description?: string;
  layout_type: string;
  background_color: string;
  width: number;
  height: number;
  text_overlays?: string;
  is_default: boolean;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export default function TemplateEditor() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  useEffect(() => {
    loadTemplates();
    initializeDefaults();
  }, []);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.text_overlays) {
      try {
        const overlays = JSON.parse(selectedTemplate.text_overlays);
        setTextOverlays(overlays);
      } catch (error) {
        console.error('Error parsing text overlays:', error);
        setTextOverlays([]);
      }
    } else {
      setTextOverlays([]);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = await window.electronAPI.template.getAll(false);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      await window.electronAPI.template.initDefaults();
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  };

  const startEditing = (template?: Template) => {
    if (template) {
      setEditForm({
        id: template.id,
        name: template.name,
        description: template.description || '',
        layout_type: template.layout_type,
        background_color: template.background_color,
        width: template.width,
        height: template.height,
      });
      setSelectedTemplate(template);
    } else {
      // New template
      setEditForm({
        name: '',
        description: '',
        layout_type: 'single',
        background_color: '#ffffff',
        width: 1800,
        height: 1200,
      });
      setTextOverlays([]);
    }
    setIsEditing(true);
  };

  const saveTemplate = async () => {
    try {
      const templateData = {
        ...editForm,
        text_overlays: textOverlays,
      };

      if (editForm.id) {
        // Update existing
        await window.electronAPI.template.update(editForm.id, templateData);
        alert('✅ Template updated!');
      } else {
        // Create new
        await window.electronAPI.template.create(templateData);
        alert('✅ Template created!');
      }

      setIsEditing(false);
      setEditForm(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await window.electronAPI.template.delete(id);
      alert('✅ Template deleted!');
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: `overlay_${Date.now()}`,
      text: 'New Text',
      x: 900,
      y: 600,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
    };
    setTextOverlays([...textOverlays, newOverlay]);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(
      textOverlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter((overlay) => overlay.id !== id));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📋 Templates</h2>
            <p className="text-sm text-gray-400">
              Create and manage photo templates
            </p>
          </div>
          <button
            onClick={() => startEditing()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
          >
            ✨ Create Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Template List */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4">
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.is_default && (
                    <span className="text-xs bg-green-600 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm opacity-80">{template.description}</p>
                )}
                <div className="text-xs mt-2 opacity-70">
                  {template.layout_type} • {template.width}x{template.height}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Preview/Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            // Edit Mode
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-6">
                {editForm.id ? 'Edit Template' : 'Create Template'}
              </h3>

              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="My Template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={2}
                      placeholder="Template description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Layout Type</label>
                      <select
                        value={editForm.layout_type}
                        onChange={(e) => setEditForm({ ...editForm, layout_type: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="single">Single</option>
                        <option value="strip-3">3-Strip</option>
                        <option value="strip-4">4-Strip</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Background Color</label>
                      <input
                        type="color"
                        value={editForm.background_color}
                        onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                        className="w-full h-10 bg-gray-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Width (px)</label>
                      <input
                        type="number"
                        value={editForm.width}
                        onChange={(e) => setEditForm({ ...editForm, width: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Height (px)</label>
                      <input
                        type="number"
                        value={editForm.height}
                        onChange={(e) => setEditForm({ ...editForm, height: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Overlays */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Text Overlays</h4>
                  <button
                    onClick={addTextOverlay}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    ➕ Add Text
                  </button>
                </div>

                <div className="space-y-4">
                  {textOverlays.map((overlay) => (
                    <div key={overlay.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Text</label>
                          <input
                            type="text"
                            value={overlay.text}
                            onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                            className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm outline-none"
                            placeholder="{{guestName}} or static text"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Font Size</label>
                          <input
                            type="number"
                            value={overlay.fontSize}
                            onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                            className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">X Position</label>
                          <input
                            type="number"
                            value={overlay.x}
                            onChange={(e) => updateTextOverlay(overlay.id, { x: parseInt(e.target.value) })}
                            className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Y Position</label>
                          <input
                            type="number"
                            value={overlay.y}
                            onChange={(e) => updateTextOverlay(overlay.id, { y: parseInt(e.target.value) })}
                            className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Color</label>
                          <input
                            type="color"
                            value={overlay.color}
                            onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            className="w-full h-7 bg-gray-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <select
                          value={overlay.align}
                          onChange={(e) => updateTextOverlay(overlay.id, { align: e.target.value as any })}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm outline-none"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>

                        <button
                          onClick={() => removeTextOverlay(overlay.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {textOverlays.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No text overlays added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={saveTemplate}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 font-medium"
                >
                  💾 Save Template
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(null);
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedTemplate ? (
            // View Mode
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">{selectedTemplate.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(selectedTemplate)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    {!selectedTemplate.is_default && (
                      <button
                        onClick={() => deleteTemplate(selectedTemplate.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                {selectedTemplate.description && (
                  <p className="text-gray-400 mb-4">{selectedTemplate.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Layout Type</div>
                    <div className="font-medium">{selectedTemplate.layout_type}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Dimensions</div>
                    <div className="font-medium">
                      {selectedTemplate.width} × {selectedTemplate.height}
                    </div>
                  </div>
                </div>

                {textOverlays.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Text Overlays</h4>
                    <div className="space-y-2">
                      {textOverlays.map((overlay) => (
                        <div key={overlay.id} className="bg-gray-600 rounded p-3 text-sm">
                          <div className="font-medium mb-1">"{overlay.text}"</div>
                          <div className="text-gray-300">
                            Position: ({overlay.x}, {overlay.y}) • Size: {overlay.fontSize}px • 
                            Align: {overlay.align}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p>Select a template to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}