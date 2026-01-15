interface PreviewStepProps {
  finalPhotoPath: string;
  onRetake: () => void;
  onSave: () => void;
  onPrint: () => void;
}

const getMediaUrl = (pathValue: string | undefined) => {
  if (!pathValue) return '';

  // Strip ALL existing prefixes to get back to the raw disk path
  let cleanPath = pathValue
    .replace(/^(file:\/\/|media:\/+)/g, '')
    .replace(/^local-resource\//g, '')
    .replace(/\\/g, '/');

  // Reconstruct with safe custom protocol
  return `media://local-resource/${cleanPath}`;
};

export function PreviewStep({ finalPhotoPath, onRetake, onSave, onPrint }: PreviewStepProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Preview Your Photo</h2>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <img src={getMediaUrl(finalPhotoPath)} alt="Final preview" className="w-full rounded-lg shadow-lg" />
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRetake}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            🔄 Retake
          </button>
          <button
            onClick={onSave}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            💾 Save
          </button>
          <button
            onClick={onPrint}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}
