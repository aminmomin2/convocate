/**
 * Components Index
 * 
 * Main index file for all organized component directories to enable
 * clean imports throughout the application.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

// Chat components
export * from './chat';

// Landing page components
export * from './landing';

// Upload components
export * from './upload';

// Individual components (if not organized into directories yet)
export { default as ChatWindow } from './ChatWindow';
export { default as FileUploadDropbox } from './upload/FileUploadDropbox';
export { default as PersonaSelector } from './PersonaSelector';
export { default as ScorePanel } from './ScorePanel';
export { default as PersonaNaming } from './PersonaNaming';
