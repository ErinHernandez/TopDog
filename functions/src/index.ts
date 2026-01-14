/**
 * Firebase Functions Entry Point
 * 
 * Exports all Cloud Functions for deployment
 */

import { onDraftUpdate } from './draftTriggers';

export { onDraftUpdate };
