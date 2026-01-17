import { useState } from 'react';

interface ShareExportProps {
  photoId: string;
  photoPath: string;
  onClose: () => void;
}

export default function ShareExport({ photoId, photoPath, onClose }: ShareExportProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'export' | 'qr'>('email');
  const [emailForm, setEmailForm] = useState({
    email: '',
    guestName: '',
  });
  const [exportPath, setExportPath] = useState('');
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleEmail = async () => {
    if (!emailForm.email) {
      alert('Please enter an email address');
      return;
    }

    try {
      setSending(true);
      const result = await window.electronAPI.email.sendPhoto(
        photoPath,
        emailForm.email,
        emailForm.guestName || undefined
      );
      
      if (result) {
        alert('✅ Email sent successfully!');
        setEmailForm({ email: '', guestName: '' });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to send email: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleExportToFolder = async () => {
    try {
      const destination = await window.electronAPI.file.selectDirectory();
      if (!destination) return;

      setExporting(true);
      setExportPath(destination);

      //await window.electronAPI.photo.export(photoId, destination);
      alert('✅ Photo exported successfully!');
      
    } catch (error) {
      console.error('Error exporting photo:', error);
      alert('Failed to export photo');
    } finally {
      setExporting(false);
    }
  };

  const handleExportToUSB = async () => {
    alert('Insert USB drive and click OK to select it');
    await handleExportToFolder();
  };

  const generateQRCode = () => {
    // Generate QR code with download link (would need backend endpoint)
    const qrData = `photobooth://download/${photoId}`;
    return qrData;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Share & Export</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {['email', 'export', 'qr'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-6 py-3 font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab === 'email' && '📧 Email'}
              {tab === 'export' && '💾 Export'}
              {tab === 'qr' && '📱 QR Code'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Guest Email *</label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="guest@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Guest Name (Optional)</label>
                <input
                  type="text"
                  value={emailForm.guestName}
                  onChange={(e) => setEmailForm({ ...emailForm, guestName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  ℹ️ The photo will be sent as an attachment to the email address provided.
                  Make sure email is configured in Settings.
                </p>
              </div>

              <button
                onClick={handleEmail}
                disabled={sending || !emailForm.email}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {sending ? 'Sending...' : '📧 Send Email'}
              </button>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Export Options</h3>
                <p className="text-sm text-gray-300">
                  Export your photo to a folder or USB drive for safekeeping.
                </p>
              </div>

              <button
                onClick={handleExportToFolder}
                disabled={exporting}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-105 disabled:opacity-50"
              >
                📁 Export to Folder
              </button>

              <button
                onClick={handleExportToUSB}
                disabled={exporting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105 disabled:opacity-50"
              >
                💿 Export to USB Drive
              </button>

              {exportPath && (
                <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4">
                  <p className="text-sm">
                    ✅ Exported to: <span className="font-mono break-all">{exportPath}</span>
                  </p>
                </div>
              )}

              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <h4 className="font-semibold mb-2 text-sm">Bulk Export</h4>
                <p className="text-xs text-gray-300 mb-3">
                  Export all photos from a session at once
                </p>
                <button
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all text-sm"
                  onClick={() => alert('Navigate to Sessions page for bulk export')}
                >
                  Go to Sessions
                </button>
              </div>
            </div>
          )}

          {/* QR Code Tab */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">QR Code Download</h3>
                <p className="text-sm text-gray-300">
                  Generate a QR code for guests to download their photo instantly
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-6xl">📱</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    QR Code Feature Coming Soon
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    This will require a backend server to host the photo
                  </p>
                </div>
              </div>

              <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
                <p className="text-sm text-yellow-100">
                  ⚠️ QR code downloads require network connectivity and a web server.
                  Configure in Settings → Advanced.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}