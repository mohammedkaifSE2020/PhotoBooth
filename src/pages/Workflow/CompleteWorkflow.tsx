import { useState, useEffect } from 'react';
import { CameraStep } from './steps/CameraStep';
import { TemplateStep } from './steps/TemplateStep';
import { CustomizeStep } from './steps/CustomizeStep';
import { PreviewStep } from './steps/PreviewStep';
import { FinalStep } from './steps/FinalStep';
import { CapturedPhoto, CustomOverlays, Template, WorkflowStep } from './types';
import { photoProcessingService } from '@/services/photoProcessingService';

export default function CompleteWorkflow() {
  const [step, setStep] = useState<WorkflowStep>('camera');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [finalPhoto, setFinalPhoto] = useState<any>(null);
  const [customOverlays, setCustomOverlays] = useState<CustomOverlays>({
    guestName: '',
    eventDate: new Date().toLocaleDateString(),
    customText: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await window.electronAPI.template.getAll(true);
      setTemplates(allTemplates);
      if (allTemplates.length > 0) {
        setSelectedTemplate(allTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    }
  };

  const handlePhotoCaptured = (photo: CapturedPhoto) => {
    console.log(photo)
    setCapturedPhotos([photo]);
    setStep('template');
  };

  const handleApplyTemplate = async () => {
    if (!capturedPhotos[0] || !selectedTemplate) return;

    try {
      const savedPhotoResponse = await photoProcessingService.saveAndProcessPhotos(
        [capturedPhotos[0]],
        'single'
      );

      // Apply template
      const processedPhoto = await window.electronAPI.template.apply(
        savedPhotoResponse.id, //photo ID
        selectedTemplate.id,
        customOverlays
      );
      console.log(processedPhoto)
      setFinalPhoto(processedPhoto);
      setStep('preview');
    } catch (error) {
      console.error('Error applying template:', error);
      setError('Failed to apply template');
    }
  };

  const handleSave = async () => {
    alert('✅ Photo saved successfully!');
    setStep('final');
  };

  const handlePrint = async () => {
    if (!finalPhoto) return;

    try {
      // const printSettings = await window.electronAPI.print.getSettings();
      // await window.electronAPI.print.printPhoto(
      //   finalPhoto.id,
      //   printSettings.paper_size,
      //   printSettings.default_printer_id
      // );
      // alert('✅ Print job sent!');
      setStep('final');
    } catch (error) {
      console.error('Error printing:', error);
      setError('Failed to print photo');
    }
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setFinalPhoto(null);
    setStep('camera');
  };

  const handleStartNew = () => {
    setCapturedPhotos([]);
    setFinalPhoto(null);
    setSelectedTemplate(templates.length > 0 ? templates[0] : null);
    setCustomOverlays({
      guestName: '',
      eventDate: new Date().toLocaleDateString(),
      customText: '',
    });
    setError(null);
    setStep('camera');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Progress Bar */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {['camera', 'template', 'customize', 'preview', 'final'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                      ? 'bg-blue-600 text-white scale-110'
                      : ['camera', 'template', 'customize', 'preview', 'final'].indexOf(step) > index
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${['camera', 'template', 'customize', 'preview', 'final'].indexOf(step) > index
                        ? 'bg-green-600'
                        : 'bg-gray-700'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-400">
            {step === 'camera' && 'Step 1: Capture Photo'}
            {step === 'template' && 'Step 2: Select Template'}
            {step === 'customize' && 'Step 3: Customize'}
            {step === 'preview' && 'Step 4: Preview & Confirm'}
            {step === 'final' && 'Step 5: Complete!'}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-lg hover:text-gray-200">
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {step === 'camera' && <CameraStep onPhotoCaptured={handlePhotoCaptured} onError={setError} />}

        {step === 'template' && (
          <TemplateStep
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onNext={() => setStep('customize')}
            onBack={handleRetake}
          />
        )}

        {step === 'customize' && (
          <CustomizeStep
            customOverlays={customOverlays}
            onUpdate={setCustomOverlays}
            onNext={handleApplyTemplate}
            onBack={() => setStep('template')}
          />
        )}

        {step === 'preview' && finalPhoto && (
          <PreviewStep
            finalPhotoPath={finalPhoto.filepath}
            onRetake={handleRetake}
            onSave={handleSave}
            onPrint={handlePrint}
          />
        )}

        {step === 'final' && <FinalStep onStartNew={handleStartNew} />}
      </div>
    </div>
  );
}
