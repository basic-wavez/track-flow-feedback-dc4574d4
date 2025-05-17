
// Re-export all track-related services for backwards compatibility
export {
  uploadTrack
} from './trackCreationService';

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

// Add the track deletion service
export {
  deleteTrack
} from './trackDeletionService';

// Add the share links service
export {
  createShareLink,
  getShareLinks,
  incrementPlayCount,
  deleteShareLink,
  getTrackIdByShareKey
} from './trackShareService';

// Add the track version service
export {
  createTrackVersion
} from './trackVersionService';
