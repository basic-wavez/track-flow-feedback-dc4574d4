
// Re-export all track-related services for backwards compatibility
export {
  uploadTrack
} from './trackUploadService';

export {
  getTrack,
  getTrackChunkUrls,
  getUserTracks
} from './trackQueryService';

export {
  updateTrackDetails
} from './trackUpdateService';

export {
  requestMp3Processing,
  requestTrackProcessing,
  getTrackProcessingStatus
} from './trackProcessingService';

// Add the new track deletion service
export {
  deleteTrack
} from './trackDeletionService';
