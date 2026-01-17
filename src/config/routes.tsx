import { lazy } from 'react';
import { Camera, Image, Settings, Layout, Share2 } from 'lucide-react';

// Lazy load components for better performance
const CameraCapture = lazy(() => import('@/pages/CaptureMode/CameraCapture'));
const PhotoGallery = lazy(() => import('@/pages/GalleryPage/PhotoGallery'));
const SettingsPanel = lazy(() => import('@/pages/SettingsPage/SettingsPanel'));
const TemplateEditor = lazy(() => import('@/pages/Template/TemplateEditor'));
const CompleteWorkflow = lazy(() => import('@/pages/Workflow/CompleteWorkflow'));
const ShareExportPage = lazy(() => import('@/pages/ShareExportPage/ShareExportPage'));

export type RouteKey = 'capture' | 'workflow' | 'gallery' | 'settings' | 'templates' | 'share-export';

export interface RouteConfig {
  key: RouteKey;
  path: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  showInNav: boolean;
}

export const routeConfig: RouteConfig[] = [
  {
    key: 'capture',
    path: '/capture',
    label: 'Capture',
    icon: <Camera className="size-4" />,
    component: CameraCapture,
    showInNav: true,
  },
  {
    key: 'workflow',
    path: '/workflow',
    label: 'Workflow',
    icon: <Camera className="size-4" />,
    component: CompleteWorkflow,
    showInNav: true,
  },
  {
    key: 'gallery',
    path: '/gallery',
    label: 'Gallery',
    icon: <Image className="size-4" />,
    component: PhotoGallery,
    showInNav: true,
  },
  {
    key: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: <Settings className="size-4" />,
    component: SettingsPanel,
    showInNav: true,
  },
  {
    key: 'templates',
    path: '/templates',
    label: 'Templates',
    icon: <Layout className="size-4" />,
    component: TemplateEditor,
    showInNav: true,
  },
  {
    key: 'share-export',
    path: '/share-export',
    label: 'Share & Export',
    icon: <Share2 className="size-4" />,
    component: ShareExportPage,
    showInNav: false,
  },
];

export const getRoute = (key: RouteKey) => {
  return routeConfig.find((r) => r.key === key);
};

export const getRouteByPath = (path: string) => {
  return routeConfig.find((r) => r.path === path);
};
