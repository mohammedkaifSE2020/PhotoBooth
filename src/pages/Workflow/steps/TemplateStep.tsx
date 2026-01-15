import { Template } from '../types';

interface TemplateStepProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TemplateStep({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onNext,
  onBack,
}: TemplateStepProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Select a Template</h2>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                selectedTemplate?.id === template.id ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              <div className="aspect-video bg-gray-700 rounded mb-3 flex items-center justify-center">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="font-semibold">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-400 mt-1">{template.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            ← Retake Photo
          </button>
          <button
            onClick={onNext}
            disabled={!selectedTemplate}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            Next: Customize →
          </button>
        </div>
      </div>
    </div>
  );
}
