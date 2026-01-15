import { useEffect, useState } from "react";

interface Template {
  id: string;
  name: string;
  description?: string;
  layout_type: string;
  thumbnail_path?: string;
}

export function useTemplate() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [templatesError, setTemplatesError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const allTemplates = await window.electronAPI.template.getAll(true);
                setTemplates(allTemplates);
                if (allTemplates.length > 0) {
                    setSelectedTemplate(allTemplates[0]);
                }
            } catch (error) {
                console.error('Error loading templates:', error);
            }
        }

        loadTemplates();
    }, []);

    return {
        templates,
        loadingTemplates,
        templatesError,
        selectedTemplate,
        setSelectedTemplate,
    }
}