
// This file is now just re-exporting functionality from the more focused modules
// for backwards compatibility with existing code that imports from here

import { uploadTrack } from "./trackCreationService";
import { createTrackVersion } from "./trackVersionService";

export { uploadTrack, createTrackVersion };
