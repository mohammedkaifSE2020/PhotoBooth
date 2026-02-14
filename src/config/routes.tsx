import { lazy } from 'react';
import { Camera, Image, Settings, Layout, Share2, FolderOpen, FilePlus } from 'lucide-react';


// Lazy load components for better performance
const CameraCapture = lazy(() => import('@/pages/CaptureMode/CameraCapture'));
const PhotoGallery = lazy(() => import('@/pages/GalleryPage/PhotoGallery'));
const SettingsPanel = lazy(() => import('@/pages/SettingsPage/SettingsPanel'));
const TemplateEditor = lazy(() => import('@/pages/Template/TemplateEditor'));
const CompleteWorkflow = lazy(() => import('@/pages/Workflow/CompleteWorkflow'));
const ShareExportPage = lazy(() => import('@/pages/ShareExportPage/ShareExportPage'));
const GroupsPage = lazy(() => import('@/pages/Groups/GroupsPage'));
const CreateGroupPage = lazy(() => import('@/pages/Groups/CreateGroupPage'));
const ImportFrameGallery = lazy(() => import('@/pages/Frames/ImportFrame').then(module => ({ default: module.ImportFrameGallery })));

export type RouteKey = 'capture' | 'workflow' | 'gallery' | 'settings' | 'templates' | 'share-export' | 'groups' | 'create-group' | 'import-frames';

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
  {
    key: 'groups',
    path: '/groups',
    label: 'Groups',
    icon: <FolderOpen className="size-4" />,
    component: GroupsPage,
    showInNav: true,
  },
  {
    key: 'create-group',
    path: '/groups/create',
    label: 'Create Group',
    icon: <FolderOpen className="size-4" />,
    component: CreateGroupPage,
    showInNav: true,
  },
  {
    key: 'import-frames',
    path: '/frames/import', 
    label: 'Import Frames',
    icon: <FilePlus className="size-4" />,
    component: ImportFrameGallery,
    showInNav: true,
  }
];

export const getRoute = (key: RouteKey) => {
  return routeConfig.find((r) => r.key === key);
};

export const getRouteByPath = (path: string) => {
  return routeConfig.find((r) => r.path === path);
};
