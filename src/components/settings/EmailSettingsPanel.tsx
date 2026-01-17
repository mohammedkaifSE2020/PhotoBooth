import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
}

export default function EmailSettingsPanel() {
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    enabled: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const config = await window.electronAPI.email.getConfig();
      setSettings(config);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load email settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await window.electronAPI.email.updateConfig(settings);
      setMessage({ type: 'success', text: 'Email settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await window.electronAPI.email.testConfig();
      if (result) {
        setMessage({ type: 'success', text: 'Email configuration test successful!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Email test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">📧 Email Configuration</h3>
        <p className="text-gray-400 text-sm mb-6">
          Configure SMTP settings to enable email photo delivery
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500 bg-opacity-20 text-green-100' 
            : 'bg-red-500 bg-opacity-20 text-red-100'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Enable Email */}
      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <label className="font-medium">Enable Email</label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => handleInputChange('enabled', e.target.checked)}
          className="w-4 h-4"
        />
      </div>

      {/* SMTP Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">SMTP Host</label>
          <input
            type="text"
            placeholder="smtp.gmail.com"
            value={settings.smtp_host}
            onChange={(e) => handleInputChange('smtp_host', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">SMTP Port</label>
          <input
            type="number"
            placeholder="587"
            value={settings.smtp_port}
            onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Security */}
      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <label className="font-medium text-sm">Use TLS/SSL (Secure)</label>
        <input
          type="checkbox"
          checked={settings.smtp_secure}
          onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
          className="w-4 h-4"
        />
      </div>

      {/* Credentials */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">SMTP Username / Email</label>
          <input
            type="email"
            placeholder="your-email@gmail.com"
            value={settings.smtp_user}
            onChange={(e) => handleInputChange('smtp_user', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">SMTP Password / App Password</label>
          <input
            type="password"
            placeholder="Enter password or app-specific password"
            value={settings.smtp_password}
            onChange={(e) => handleInputChange('smtp_password', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            💡 For Gmail: Use an <a href="https://myaccount.google.com/apppasswords" className="text-blue-400 hover:underline">App Password</a>, not your regular password
          </p>
        </div>
      </div>

      {/* From Settings */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">From Email Address</label>
          <input
            type="email"
            placeholder="noreply@photobooth.local"
            value={settings.from_email}
            onChange={(e) => handleInputChange('from_email', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">From Name</label>
          <input
            type="text"
            placeholder="PhotoBooth Pro"
            value={settings.from_name}
            onChange={(e) => handleInputChange('from_name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">📝 Setup Instructions for Gmail</h4>
        <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
          <li>Enable 2-Factor Authentication in your Google Account</li>
          <li>Generate an <a href="https://myaccount.google.com/apppasswords" className="text-blue-400 hover:underline">App Password</a></li>
          <li>Use the app password (not your Gmail password)</li>
          <li>SMTP Host: <code className="bg-gray-700 px-2 py-1 rounded">smtp.gmail.com</code></li>
          <li>Port: <code className="bg-gray-700 px-2 py-1 rounded">587</code> (TLS enabled)</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || loading || !settings.enabled}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
        >
          {testing && <Loader className="w-4 h-4 animate-spin" />}
          Test Configuration
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
