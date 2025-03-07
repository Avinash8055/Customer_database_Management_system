import React, { useState, useEffect } from 'react';
import CustomerForm from '../components/CustomerForm';
import { useCustomer } from '../context/CustomerContext';
import { ListChecks, Plus, X, Settings } from 'lucide-react';
import { ChecklistItem, SavedChecklist } from '../types';

const EntryPage: React.FC = () => {
  const [savedChecklists, setSavedChecklists] = useState<SavedChecklist[]>(() => {
    const saved = localStorage.getItem('savedChecklists');
    return saved ? JSON.parse(saved) : [];
  });
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklistTitle, setChecklistTitle] = useState(() => {
    const saved = localStorage.getItem('currentChecklistTitle');
    return saved || '';
  });
  const [currentChecklist, setCurrentChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('currentChecklist');
    return saved ? JSON.parse(saved) : [];
  });

  // Save current checklist to localStorage
  useEffect(() => {
    localStorage.setItem('currentChecklist', JSON.stringify(currentChecklist));
  }, [currentChecklist]);

  // Save current checklist title to localStorage
  useEffect(() => {
    localStorage.setItem('currentChecklistTitle', checklistTitle);
  }, [checklistTitle]);

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem('savedChecklists', JSON.stringify(savedChecklists));
  }, [savedChecklists]);

  // Load default template if exists and no current checklist
  useEffect(() => {
    if (currentChecklist.length === 0 && savedChecklists.length > 0) {
      const defaultTemplate = savedChecklists[0];
      setChecklistTitle(defaultTemplate.title);
      setCurrentChecklist(defaultTemplate.items.map(text => ({
        id: Math.random().toString(36).substring(2, 9),
        text,
        completed: false
      })));
    }
  }, [savedChecklists]);

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistItem.trim(),
      completed: false
    };
    
    setCurrentChecklist([...currentChecklist, newItem]);
    setNewChecklistItem('');
  };

  const handleSaveChecklistTemplate = () => {
    if (currentChecklist.length === 0) return;
    
    const newTemplate = {
      title: checklistTitle || `Checklist Template ${savedChecklists.length + 1}`,
      items: currentChecklist.map(item => item.text)
    };
    
    setSavedChecklists([...savedChecklists, newTemplate]);
    setShowTemplateModal(false);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setCurrentChecklist(currentChecklist.filter(item => item.id !== itemId));
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setCurrentChecklist(currentChecklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleCustomerSubmitSuccess = () => {
    // Reset to default template
    if (savedChecklists.length > 0) {
      const defaultTemplate = savedChecklists[0];
      setChecklistTitle(defaultTemplate.title);
      setCurrentChecklist(defaultTemplate.items.map(text => ({
        id: Math.random().toString(36).substring(2, 9),
        text,
        completed: false
      })));
    } else {
      setCurrentChecklist([]);
      setChecklistTitle('');
    }
  };

  const handleUseTemplate = (template: SavedChecklist) => {
    setChecklistTitle(template.title);
    setCurrentChecklist(template.items.map(text => ({
      id: Math.random().toString(36).substring(2, 9),
      text,
      completed: false
    })));
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (index: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedChecklists = savedChecklists.filter((_, i) => i !== index);
      setSavedChecklists(updatedChecklists);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CustomerForm 
            checklist={currentChecklist} 
            checklistTitle={checklistTitle}
            onSubmitSuccess={handleCustomerSubmitSuccess}
          />
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ListChecks className="h-5 w-5 mr-2" />
                Checklist
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="text-gray-600 hover:text-gray-800"
                  title="Manage Templates"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowChecklistModal(true)}
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Current Checklist */}
            <div className="space-y-2">
              {currentChecklist.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No checklist items yet. Add some using the + button.
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <h3 className="font-medium text-gray-700">
                      {checklistTitle || 'Checklist'}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {currentChecklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklistItem(item.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          />
                          <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                            {item.text}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Checklist Item</h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checklist Title
              </label>
              <input
                type="text"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                placeholder="Enter checklist title (optional)"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add new checklist item"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddChecklistItem();
                    }
                  }}
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Management Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Manage Checklist Templates</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {savedChecklists.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No saved templates yet.
                </div>
              ) : (
                savedChecklists.map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-700">{template.title}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {template.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-gray-600">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="border-t mt-6 pt-4">
              <button
                onClick={handleSaveChecklistTemplate}
                disabled={currentChecklist.length === 0}
                className={`w-full py-2 px-4 rounded-md ${
                  currentChecklist.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition`}
              >
                Save Current as Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryPage;