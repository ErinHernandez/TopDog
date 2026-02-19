# Push Notifications Status - Draft Alerts

**Last Updated:** January 2026

---

## ✅ What Works Now (Sandbox Ready)

### Web Notifications (Local)
- ✅ **Works when:** Browser tab is open (even if hidden/background)
- ✅ **Works on:** All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ **Works for:** All 5 alert types
- ✅ **Features:**
  - Click to open draft room
  - Sound and vibration
  - Individual alert preferences
  - Service worker integration

### Current Limitations
- ⚠️ **Does NOT work when:** Browser is completely closed
- ⚠️ **Does NOT work when:** App is force-quit
- ⚠️ **Requires:** Tab to be open (can be hidden)

---

## 🎯 Sandbox Testing Strategy

### Simulating "Closed App" Behavior

**Method 1: Hidden Tab**
1. Open draft room in browser
2. Switch to another tab (keep browser open)
3. Trigger alert condition
4. ✅ Notification appears (simulates closed app)

**Method 2: Minimized Window**
1. Open draft room
2. Minimize browser window
3. Trigger alert condition
4. ✅ Notification appears

**Method 3: Service Worker Test**
1. Register service worker
2. Close all tabs
3. Trigger alert from another device/server
4. ⚠️ Won't work without true push (needs FCM)

---

## 📋 Implementation Roadmap

### Phase 1: Sandbox Mode ✅ COMPLETE
- ✅ Web notifications working
- ✅ Service worker integrated
- ✅ Click handlers working
- ✅ User preferences working

**Status:** Ready for sandbox testing

---

### Phase 2: FCM Integration ⏳ PLANNED

**Estimated Time:** 4-6 hours

**Tasks:**
1. Set up FCM in Firebase Console
2. Create `lib/pushNotifications/fcmService.ts`
3. Create `public/firebase-messaging-sw.js`
4. Integrate token management
5. Test on all devices

**Deliverables:**
- FCM token subscription
- Foreground message handling
- Token storage in Firestore

**Status:** Plan created, ready to implement

---

### Phase 3: Server-Side Push ⏳ PLANNED

**Estimated Time:** 2-3 hours

**Tasks:**
1. Create Firebase Cloud Function
2. Set up FCM Admin SDK
3. Integrate with alert manager
4. Test end-to-end

**Deliverables:**
- Cloud Function for push delivery
- Works when app is completely closed
- Production-ready push notifications

**Status:** Plan created, depends on Phase 2

---

## 🚀 Quick Start for Sandbox

### Current Capabilities

**What works:**
```typescript
// Alert system is already integrated
// Just needs:
1. User enables notifications in browser
2. User enables alerts in preferences
3. Alert conditions trigger
4. Notifications appear (even if tab is hidden)
```

**To test:**
1. Enable notifications in browser
2. Open draft room
3. Switch to another tab
4. Trigger alert (e.g., go on the clock)
5. ✅ Notification appears

---

## 📊 Device Support

| Scenario | Current Solution | Status |
|----------|------------------|--------|
| Tab open, visible | Web Notification | ✅ Works |
| Tab open, hidden | Web Notification | ✅ Works |
| Tab closed, browser open | Web Notification | ✅ Works |
| Browser closed | ❌ No push | ⏳ Needs FCM |
| App force-quit | ❌ No push | ⏳ Needs FCM |
| Mobile app background | ❌ No push | ⏳ Needs FCM |

---

## 💡 Recommendation

**For Sandbox/Development:**
- ✅ Use current web notifications
- ✅ Test with tab hidden
- ✅ Document that it works when tab is open

**For Production:**
- ⏳ Implement FCM (Phase 2)
- ⏳ Add server-side push (Phase 3)
- ⏳ Full coverage for all scenarios

---

## 📝 Files to Create (When Ready)

1. `lib/pushNotifications/fcmService.ts` - FCM client service
2. `public/firebase-messaging-sw.js` - FCM service worker
3. `functions/src/draftAlerts.ts` - Cloud Function for push
4. `lib/draftAlerts/pushNotifications.ts` - Push integration

**See:** `docs/PUSH_NOTIFICATIONS_PLAN.md` for complete implementation details
