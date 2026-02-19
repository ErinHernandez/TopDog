import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SMSTelemetryBridge,
  SMSTelemetryEvent,
  SMSReviewSentEvent,
  SMSReplyReceivedEvent,
  SMSImageAnalyzedEvent,
  SMSAnnotationCreatedEvent,
  SMSThreadCompletedEvent,
  SMSOutboundReplyEvent,
} from '../../../lib/studio/telemetry/capture/sms-events';
import {
  SMSThreadTracker,
  ThreadState,
} from '../../../lib/studio/telemetry/capture/sms-thread-tracker';

describe('SMSTelemetryBridge', () => {
  let bridge: SMSTelemetryBridge;

  beforeEach(() => {
    vi.useFakeTimers({
      now: 0,
    });
    bridge = new SMSTelemetryBridge('test-session-123');
  });

  afterEach(() => {
    bridge.destroy();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Event Emission', () => {
    it('should emit sms-review-sent event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-review-sent');
          const reviewSentEvent = event as SMSReviewSentEvent;
          expect(reviewSentEvent.projectId).toBe('proj-123');
          expect(reviewSentEvent.reviewToken).toBe('token-abc');
          expect(reviewSentEvent.degradationLevel).toBe(2);
          expect(reviewSentEvent.hasImage).toBe(true);
          expect(reviewSentEvent.imageDimensions).toEqual({ width: 1024, height: 768 });
          expect(reviewSentEvent.timestamp).toBeDefined();
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitReviewSent({
          projectId: 'proj-123',
          reviewToken: 'token-abc',
          degradationLevel: 2,
          hasImage: true,
          imageDimensions: { width: 1024, height: 768 },
        });
      });
    });

    it('should emit sms-reply-received event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-reply-received');
          const replyEvent = event as SMSReplyReceivedEvent;
          expect(replyEvent.projectId).toBe('proj-123');
          expect(replyEvent.hasText).toBe(true);
          expect(replyEvent.textLength).toBe(42);
          expect(replyEvent.imageCount).toBe(2);
          expect(replyEvent.images).toHaveLength(2);
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitReplyReceived({
          projectId: 'proj-123',
          reviewToken: 'token-abc',
          hasText: true,
          textLength: 42,
          imageCount: 2,
          images: [
            {
              intent: 'annotation',
              intentConfidence: 0.95,
              dimensions: { width: 1024, height: 768 },
            },
            {
              intent: 'reference',
              intentConfidence: 0.75,
              dimensions: { width: 800, height: 600 },
            },
          ],
        });
      });
    });

    it('should emit sms-image-analyzed event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-image-analyzed');
          const imageEvent = event as SMSImageAnalyzedEvent;
          expect(imageEvent.intent).toBe('annotation');
          expect(imageEvent.confidence).toBe(0.95);
          expect(imageEvent.matchesOriginal).toBe(true);
          expect(imageEvent.isIPhoneCamera).toBe(false);
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitImageAnalyzed({
          projectId: 'proj-123',
          intent: 'annotation',
          confidence: 0.95,
          dimensions: { width: 1024, height: 768 },
          matchesOriginal: true,
          isIPhoneCamera: false,
        });
      });
    });

    it('should emit sms-annotation-created event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-annotation-created');
          const annotationEvent = event as SMSAnnotationCreatedEvent;
          expect(annotationEvent.projectId).toBe('proj-123');
          expect(annotationEvent.annotationType).toBe('text-box');
          expect(annotationEvent.dimensions).toEqual({ width: 500, height: 300 });
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitAnnotationCreated({
          projectId: 'proj-123',
          annotationType: 'text-box',
          dimensions: { width: 500, height: 300 },
        });
      });
    });

    it('should emit sms-thread-completed event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-thread-completed');
          const threadEvent = event as SMSThreadCompletedEvent;
          expect(threadEvent.projectId).toBe('proj-123');
          expect(threadEvent.messageCount).toBe(5);
          expect(threadEvent.imageCount).toBe(3);
          expect(threadEvent.durationSeconds).toBe(3600);
          expect(threadEvent.inboundCount).toBe(2);
          expect(threadEvent.outboundCount).toBe(3);
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitThreadCompleted({
          projectId: 'proj-123',
          reviewToken: 'token-abc',
          messageCount: 5,
          imageCount: 3,
          durationSeconds: 3600,
          inboundCount: 2,
          outboundCount: 3,
        });
      });
    });

    it('should emit sms-outbound-reply event', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: SMSTelemetryEvent) => {
          expect(event.type).toBe('sms-outbound-reply');
          const outboundEvent = event as SMSOutboundReplyEvent;
          expect(outboundEvent.projectId).toBe('proj-123');
          expect(outboundEvent.reviewToken).toBe('token-abc');
          expect(outboundEvent.hasImage).toBe(true);
          expect(outboundEvent.hasText).toBe(false);
          resolve();
        });

        bridge.onEvent(listener);
        bridge.emitOutboundReply({
          projectId: 'proj-123',
          reviewToken: 'token-abc',
          hasImage: true,
          hasText: false,
        });
      });
    });
  });

  describe('Event Listener Subscription', () => {
    it('should register multiple listeners and dispatch to all', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      bridge.onEvent(listener1);
      bridge.onEvent(listener2);
      bridge.onEvent(listener3);

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
      expect(listener3).toHaveBeenCalledOnce();
    });

    it('should unsubscribe listener', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.onEvent(listener);

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });
      expect(listener).toHaveBeenCalledOnce();

      unsubscribe();

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });
      expect(listener).toHaveBeenCalledOnce();
    });

    it('should handle listener error gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      bridge.onEvent(errorListener);
      bridge.onEvent(goodListener);

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      expect(errorListener).toHaveBeenCalledOnce();
      expect(goodListener).toHaveBeenCalledOnce();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should return new unsubscribe function each time', () => {
      const listener = vi.fn();
      const unsubscribe1 = bridge.onEvent(listener);
      const unsubscribe2 = bridge.onEvent(listener);

      expect(unsubscribe1).not.toBe(unsubscribe2);

      unsubscribe1();
      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe2();
      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Buffering and Flushing', () => {
    it('should buffer events in memory', () => {
      const listener = vi.fn();
      bridge.onEvent(listener);

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      const stats = bridge.getStats();
      expect(stats.buffered).toBe(1);
      expect(stats.totalEmitted).toBe(1);
    });

    it('should auto-flush when buffer reaches max size', () => {
      const listener = vi.fn();
      bridge.onEvent(listener);

      for (let i = 0; i < 50; i++) {
        bridge.emitReviewSent({
          projectId: `proj-${i}`,
          reviewToken: `token-${i}`,
          degradationLevel: 0,
          hasImage: false,
        });
      }

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(50);

      bridge.emitReviewSent({
        projectId: 'proj-final',
        reviewToken: 'token-final',
        degradationLevel: 0,
        hasImage: false,
      });

      stats = bridge.getStats();
      expect(stats.buffered).toBe(1);
      expect(stats.totalEmitted).toBe(51);
    });

    it('should manually flush buffered events', () => {
      bridge.emitReviewSent({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        degradationLevel: 0,
        hasImage: false,
      });
      bridge.emitReplyReceived({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        hasText: true,
        textLength: 10,
        imageCount: 0,
        images: [],
      });

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(2);

      const flushed = bridge.flush();
      expect(flushed).toHaveLength(2);
      expect(flushed[0].type).toBe('sms-review-sent');
      expect(flushed[1].type).toBe('sms-reply-received');

      stats = bridge.getStats();
      expect(stats.buffered).toBe(0);
    });

    it('should auto-flush buffer after 5 seconds', () => {
      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(1);

      vi.advanceTimersByTime(5000);

      stats = bridge.getStats();
      expect(stats.buffered).toBe(0);
    });

    it('should not flush empty buffer on timer', () => {
      const initialStats = bridge.getStats();
      expect(initialStats.buffered).toBe(0);

      vi.advanceTimersByTime(5000);

      const afterStats = bridge.getStats();
      expect(afterStats.buffered).toBe(0);
    });

    it('should clear buffer on flush', () => {
      for (let i = 0; i < 3; i++) {
        bridge.emitReviewSent({
          projectId: `proj-${i}`,
          reviewToken: `token-${i}`,
          degradationLevel: 0,
          hasImage: false,
        });
      }

      const flushed = bridge.flush();
      expect(flushed).toHaveLength(3);

      const stats = bridge.getStats();
      expect(stats.buffered).toBe(0);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track total emitted events', () => {
      let stats = bridge.getStats();
      expect(stats.totalEmitted).toBe(0);

      bridge.emitReviewSent({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        degradationLevel: 0,
        hasImage: false,
      });

      stats = bridge.getStats();
      expect(stats.totalEmitted).toBe(1);

      bridge.emitReplyReceived({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        hasText: true,
        textLength: 5,
        imageCount: 0,
        images: [],
      });

      stats = bridge.getStats();
      expect(stats.totalEmitted).toBe(2);
    });

    it('should reset buffer count but preserve total emitted on flush', () => {
      bridge.emitReviewSent({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        degradationLevel: 0,
        hasImage: false,
      });
      bridge.emitReplyReceived({
        projectId: 'proj-1',
        reviewToken: 'token-1',
        hasText: true,
        textLength: 5,
        imageCount: 0,
        images: [],
      });

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(2);
      expect(stats.totalEmitted).toBe(2);

      bridge.flush();

      stats = bridge.getStats();
      expect(stats.buffered).toBe(0);
      expect(stats.totalEmitted).toBe(2);
    });
  });

  describe('Cleanup and Destroy', () => {
    it('should stop auto-flush timer on destroy', () => {
      const initialStats = bridge.getStats();
      expect(initialStats.buffered).toBe(0);

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(1);
      expect(stats.totalEmitted).toBe(1);

      bridge.destroy();

      vi.advanceTimersByTime(6000);

      // After destroy, buffer should be cleared and timer should not run
      const finalStats = bridge.getStats();
      expect(finalStats.buffered).toBe(0);
      expect(finalStats.totalEmitted).toBe(1); // totalEmitted is preserved
    });

    it('should clear all listeners on destroy', () => {
      const listener = vi.fn();
      bridge.onEvent(listener);

      bridge.destroy();

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clear buffer on destroy', () => {
      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      let stats = bridge.getStats();
      expect(stats.buffered).toBe(1);

      bridge.destroy();

      stats = bridge.getStats();
      expect(stats.buffered).toBe(0);
    });
  });

  describe('Timestamp Handling', () => {
    it('should set timestamp when emitting events', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const events: SMSTelemetryEvent[] = [];
      bridge.onEvent((event) => events.push(event));

      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      const flushed = bridge.flush();
      expect(flushed[0].timestamp).toBe(now);
    });

    it('should preserve different timestamps for different events', () => {
      const events: SMSTelemetryEvent[] = [];
      bridge.onEvent((event) => events.push(event));

      const time1 = 1000;
      const time2 = 2000;

      vi.setSystemTime(time1);
      bridge.emitReviewSent({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        degradationLevel: 0,
        hasImage: false,
      });

      vi.setSystemTime(time2);
      bridge.emitReplyReceived({
        projectId: 'proj-123',
        reviewToken: 'token-abc',
        hasText: true,
        textLength: 5,
        imageCount: 0,
        images: [],
      });

      const flushed = bridge.flush();
      expect(flushed[0].timestamp).toBe(time1);
      expect(flushed[1].timestamp).toBe(time2);
    });
  });
});

describe('SMSThreadTracker', () => {
  let tracker: SMSThreadTracker;

  beforeEach(() => {
    vi.useFakeTimers({
      now: 0,
    });
    tracker = new SMSThreadTracker();
  });

  afterEach(() => {
    tracker.destroy();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Thread Lifecycle', () => {
    it('should start a new thread', () => {
      tracker.startThread('token-123', 'proj-abc', { width: 1024, height: 768 });

      const thread = tracker.getThread('token-123');
      expect(thread).toBeDefined();
      expect(thread!.reviewToken).toBe('token-123');
      expect(thread!.projectId).toBe('proj-abc');
      expect(thread!.messageCount).toBe(0);
      expect(thread!.imageCount).toBe(0);
      expect(thread!.hasAnnotations).toBe(false);
      expect(thread!.originalDesignDimensions).toEqual({ width: 1024, height: 768 });
    });

    it('should start thread without original dimensions', () => {
      tracker.startThread('token-123', 'proj-abc');

      const thread = tracker.getThread('token-123');
      expect(thread).toBeDefined();
      expect(thread!.originalDesignDimensions).toBeUndefined();
    });

    it('should track start and last activity time', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      tracker.startThread('token-123', 'proj-abc');

      const thread = tracker.getThread('token-123');
      expect(thread!.startedAt).toBe(now);
      expect(thread!.lastActivityAt).toBe(now);
    });

    it('should return undefined for non-existent thread', () => {
      const thread = tracker.getThread('non-existent');
      expect(thread).toBeUndefined();
    });
  });

  describe('Message Recording', () => {
    beforeEach(() => {
      tracker.startThread('token-123', 'proj-abc');
    });

    it('should record inbound message', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      tracker.recordMessage('token-123', 'inbound');

      const thread = tracker.getThread('token-123');
      expect(thread!.messageCount).toBe(1);
      expect(thread!.inboundCount).toBe(1);
      expect(thread!.outboundCount).toBe(0);
      expect(thread!.lastActivityAt).toBe(now);
    });

    it('should record outbound message', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      tracker.recordMessage('token-123', 'outbound');

      const thread = tracker.getThread('token-123');
      expect(thread!.messageCount).toBe(1);
      expect(thread!.inboundCount).toBe(0);
      expect(thread!.outboundCount).toBe(1);
      expect(thread!.lastActivityAt).toBe(now);
    });

    it('should record message with images', () => {
      tracker.recordMessage('token-123', 'inbound', 2);

      const thread = tracker.getThread('token-123');
      expect(thread!.messageCount).toBe(1);
      expect(thread!.imageCount).toBe(2);
    });

    it('should accumulate image count across messages', () => {
      tracker.recordMessage('token-123', 'inbound', 2);
      tracker.recordMessage('token-123', 'inbound', 1);

      const thread = tracker.getThread('token-123');
      expect(thread!.imageCount).toBe(3);
      expect(thread!.messageCount).toBe(2);
    });

    it('should ignore recording for non-existent thread', () => {
      tracker.recordMessage('non-existent', 'inbound');
      expect(true).toBe(true);
    });

    it('should update last activity on each message', () => {
      const time1 = 1000;
      const time2 = 2000;

      vi.setSystemTime(time1);
      tracker.recordMessage('token-123', 'inbound');

      let thread = tracker.getThread('token-123');
      expect(thread!.lastActivityAt).toBe(time1);

      vi.setSystemTime(time2);
      tracker.recordMessage('token-123', 'outbound');

      thread = tracker.getThread('token-123');
      expect(thread!.lastActivityAt).toBe(time2);
    });
  });

  describe('Annotation Recording', () => {
    beforeEach(() => {
      tracker.startThread('token-123', 'proj-abc');
    });

    it('should record annotation', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      tracker.recordAnnotation('token-123');

      const thread = tracker.getThread('token-123');
      expect(thread!.hasAnnotations).toBe(true);
      expect(thread!.lastActivityAt).toBe(now);
    });

    it('should ignore recording annotation for non-existent thread', () => {
      tracker.recordAnnotation('non-existent');
      expect(true).toBe(true);
    });

    it('should update last activity when recording annotation', () => {
      const time1 = 1000;
      const time2 = 2000;

      vi.setSystemTime(time1);
      tracker.startThread('token-456', 'proj-xyz');

      vi.setSystemTime(time2);
      tracker.recordAnnotation('token-456');

      const thread = tracker.getThread('token-456');
      expect(thread!.lastActivityAt).toBe(time2);
    });
  });

  describe('Thread Completion Detection', () => {
    it('should detect thread timeout after 24 hours of inactivity', () => {
      return new Promise<void>((resolve) => {
        const completedThreads: ThreadState[] = [];
        tracker.onThreadCompleted((thread) => {
          completedThreads.push(thread);
        });

        vi.setSystemTime(0);
        tracker.startThread('token-123', 'proj-abc');

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);

        vi.advanceTimersByTime(30001);

        setTimeout(() => {
          expect(completedThreads).toHaveLength(1);
          expect(completedThreads[0].reviewToken).toBe('token-123');
          resolve();
        }, 100);

        vi.advanceTimersByTime(100);
      });
    });

    it('should not timeout thread with recent activity', () => {
      const completedThreads: ThreadState[] = [];
      tracker.onThreadCompleted((thread) => {
        completedThreads.push(thread);
      });

      vi.setSystemTime(0);
      tracker.startThread('token-123', 'proj-abc');

      vi.setSystemTime(12 * 60 * 60 * 1000);
      tracker.recordMessage('token-123', 'inbound');

      vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);

      vi.advanceTimersByTime(30000);

      expect(completedThreads).toHaveLength(0);
    });

    it('should remove completed thread from tracking', () => {
      vi.setSystemTime(0);
      tracker.startThread('token-123', 'proj-abc');

      expect(tracker.getThread('token-123')).toBeDefined();

      vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(30000);

      expect(tracker.getThread('token-123')).toBeUndefined();
    });

    it('should complete multiple timed-out threads', () => {
      return new Promise<void>((resolve) => {
        const completedThreads: ThreadState[] = [];
        tracker.onThreadCompleted((thread) => {
          completedThreads.push(thread);
        });

        vi.setSystemTime(0);
        tracker.startThread('token-1', 'proj-abc');
        tracker.startThread('token-2', 'proj-abc');

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
        vi.advanceTimersByTime(30001);

        setTimeout(() => {
          expect(completedThreads).toHaveLength(2);
          expect(completedThreads.map((t) => t.reviewToken)).toContain('token-1');
          expect(completedThreads.map((t) => t.reviewToken)).toContain('token-2');
          resolve();
        }, 100);

        vi.advanceTimersByTime(100);
      });
    });
  });

  describe('Thread Completion Callbacks', () => {
    beforeEach(() => {
      tracker.startThread('token-123', 'proj-abc');
      tracker.recordMessage('token-123', 'inbound', 1);
      tracker.recordMessage('token-123', 'outbound');
    });

    it('should subscribe to thread completion events', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn((thread: ThreadState) => {
          expect(thread.reviewToken).toBe('token-123');
          expect(thread.projectId).toBe('proj-abc');
          expect(thread.messageCount).toBe(2);
          expect(thread.imageCount).toBe(1);
          resolve();
        });

        tracker.onThreadCompleted(callback);

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
        vi.advanceTimersByTime(30001);
      });
    });

    it('should call multiple completion callbacks', () => {
      return new Promise<void>((resolve) => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const callback3 = vi.fn();

        tracker.onThreadCompleted(callback1);
        tracker.onThreadCompleted(callback2);
        tracker.onThreadCompleted(callback3);

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
        vi.advanceTimersByTime(30001);

        setTimeout(() => {
          expect(callback1).toHaveBeenCalledOnce();
          expect(callback2).toHaveBeenCalledOnce();
          expect(callback3).toHaveBeenCalledOnce();
          resolve();
        }, 100);

        vi.advanceTimersByTime(100);
      });
    });

    it('should unsubscribe from completion events', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn();
        const unsubscribe = tracker.onThreadCompleted(callback);

        vi.setSystemTime(0);
        tracker.startThread('token-456', 'proj-xyz');

        unsubscribe();

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
        vi.advanceTimersByTime(30001);

        setTimeout(() => {
          expect(callback).not.toHaveBeenCalled();
          resolve();
        }, 100);

        vi.advanceTimersByTime(100);
      });
    });

    it('should handle callback error gracefully', () => {
      return new Promise<void>((resolve) => {
        const errorCallback = vi.fn(() => {
          throw new Error('Callback error');
        });
        const goodCallback = vi.fn();

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        tracker.onThreadCompleted(errorCallback);
        tracker.onThreadCompleted(goodCallback);

        vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
        vi.advanceTimersByTime(30001);

        setTimeout(() => {
          expect(errorCallback).toHaveBeenCalledOnce();
          expect(goodCallback).toHaveBeenCalledOnce();
          expect(consoleError).toHaveBeenCalled();
          consoleError.mockRestore();
          resolve();
        }, 100);

        vi.advanceTimersByTime(100);
      });
    });

    it('should provide complete thread state to callback', (done) => {
      const callback = vi.fn((thread: ThreadState) => {
        expect(thread).toEqual({
          reviewToken: 'token-123',
          projectId: 'proj-abc',
          startedAt: expect.any(Number),
          lastActivityAt: expect.any(Number),
          messageCount: 2,
          imageCount: 1,
          inboundCount: 1,
          outboundCount: 1,
          hasAnnotations: false,
          originalDesignDimensions: undefined,
        });
        done();
      });

      tracker.onThreadCompleted(callback);

      vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(30000);
    });
  });

  describe('Active Thread Counting', () => {
    it('should return 0 for no active threads', () => {
      expect(tracker.getActiveThreadCount()).toBe(0);
    });

    it('should count active threads', () => {
      tracker.startThread('token-1', 'proj-abc');
      expect(tracker.getActiveThreadCount()).toBe(1);

      tracker.startThread('token-2', 'proj-abc');
      expect(tracker.getActiveThreadCount()).toBe(2);

      tracker.startThread('token-3', 'proj-xyz');
      expect(tracker.getActiveThreadCount()).toBe(3);
    });

    it('should decrease count when thread completes', () => {
      tracker.startThread('token-1', 'proj-abc');
      tracker.startThread('token-2', 'proj-abc');

      expect(tracker.getActiveThreadCount()).toBe(2);

      tracker.completeThread('token-1');

      expect(tracker.getActiveThreadCount()).toBe(1);
    });
  });

  describe('Force Complete Thread', () => {
    it('should force complete a thread', () => {
      tracker.startThread('token-123', 'proj-abc');
      tracker.recordMessage('token-123', 'inbound', 1);

      const completed = tracker.completeThread('token-123');

      expect(completed).toBeDefined();
      expect(completed!.reviewToken).toBe('token-123');
      expect(completed!.messageCount).toBe(1);
      expect(tracker.getThread('token-123')).toBeUndefined();
    });

    it('should return undefined for non-existent thread', () => {
      const completed = tracker.completeThread('non-existent');
      expect(completed).toBeUndefined();
    });

    it('should trigger callbacks on force complete', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn();
        tracker.onThreadCompleted(callback);

        tracker.startThread('token-123', 'proj-abc');
        tracker.completeThread('token-123');

        setTimeout(() => {
          expect(callback).toHaveBeenCalledOnce();
          expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
              reviewToken: 'token-123',
            })
          );
          resolve();
        }, 10);

        vi.advanceTimersByTime(10);
      });
    });
  });

  describe('Cleanup and Destroy', () => {
    it('should stop completion check on destroy', () => {
      const callback = vi.fn();
      tracker.onThreadCompleted(callback);

      vi.setSystemTime(0);
      tracker.startThread('token-123', 'proj-abc');

      tracker.destroy();

      vi.setSystemTime(24 * 60 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(30000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all threads on destroy', () => {
      tracker.startThread('token-1', 'proj-abc');
      tracker.startThread('token-2', 'proj-abc');

      expect(tracker.getActiveThreadCount()).toBe(2);

      tracker.destroy();

      expect(tracker.getActiveThreadCount()).toBe(0);
      expect(tracker.getThread('token-1')).toBeUndefined();
      expect(tracker.getThread('token-2')).toBeUndefined();
    });

    it('should clear all callbacks on destroy', () => {
      const callback = vi.fn();
      tracker.onThreadCompleted(callback);

      tracker.destroy();
      tracker.startThread('token-123', 'proj-abc');
      tracker.completeThread('token-123');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
