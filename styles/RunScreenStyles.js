import { StyleSheet, Dimensions, Platform } from 'react-native';
import { T, FONT } from '../constants/typography';

const { height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    ...T.bodyMuted,
    fontSize: 14,
  },
  gpsLoadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsPulse3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#24C789',
  },
  gpsPulse2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#24C789',
  },
  gpsPulse1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#24C789',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  gpsLoadingTitle: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: '#0B0F13',
    marginTop: 44,
    letterSpacing: -0.5,
  },
  gpsLoadingDesc: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: '#9AA0A6',
    marginTop: 6,
  },
  mapContainer: {
    height: height,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Floating chrome over the map
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 240,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : Platform.OS === 'web' ? 90 : 40,
    left: 16,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },

  spectatorBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : Platform.OS === 'web' ? 90 : 40,
    right: 16,
    zIndex: 999,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  spectatorBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  spectatorBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24C789',
  },
  spectatorBadgeDotWeak: {
    backgroundColor: '#FF5A36',
  },
  spectatorBadgeText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#0B0F13',
    letterSpacing: 0.2,
  },

  cheerBubble: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cheerText: {
    fontSize: 22,
  },

  // Bottom sheet — deliberately shorter so map stays prominent.
  // The extra 200 px below bottom: -200 is a paint buffer so the white
  // panel never shows a gap during bounce animations on iOS.
  dashboardContainer: {
    position: 'absolute',
    bottom: -200,
    left: 0,
    right: 0,
    height: height * 0.58 + 200,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: 220,
    justifyContent: 'flex-start',
  },
  dashboardPreRun: {
    height: height * 0.6 + 200,
  },
  // Paused state hosts drag handle + MetricDashboard + RunLivePanel +
  // a circular Resume/Stop control row (~580pt of content). We OVERRIDE
  // the base bottom:-200 / paddingBottom:220 bounce buffer here, because
  //   (a) the paused panel doesn't spring-overshoot (it's user-parked)
  //   (b) the buffer was eating 200pt and hiding the circular buttons
  //       behind the tab bar.
  // Anchoring to bottom:0 with a tall enough height + modest paddingBottom
  // guarantees every control sits above the dock on every modern phone.
  // Keep-style bottom sheet: hugs its content (height comes from the inline
  // `height: undefined` override in RunScreen, which nukes the base fixed
  // height) so there is never a tall white gap below the Resume/Stop controls.
  // paddingBottom lifts those controls clear of the floating tab dock.
  dashboardPaused: {
    bottom: 0,
    height: undefined,
    // Tab bar island + safe area — keep controls reachable without a tall dead zone.
    paddingBottom: Platform.OS === 'ios' ? 56 : Platform.OS === 'android' ? 52 : 48,
  },
  dashboardSpectate: {
    height: height * 0.28 + 200,
  },
  dashboardSpectateExpanded: {
    height: height * 0.54 + 200,
  },
  dashboardCollapsed: {
    flex: 0,
    height: 180,
    justifyContent: 'flex-start',
  },
  dragHandleContainer: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E4E6EA',
    borderRadius: 2,
  },

  // Hairline between stats zone and action buttons in the bottom panel
  panelDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(11,15,19,0.07)',
    marginHorizontal: 24,
    marginBottom: 16,
  },

  // Map avatar halo (around the runner dot)
  avatarHaloOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(36, 199, 137, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHaloInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#24C789',
    overflow: 'hidden',
  },
  mapAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapAvatarEmoji: {
    fontSize: 18,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statValue: {
    ...T.metricL,
    fontSize: 34,
    letterSpacing: -1,
  },
  statLabel: {
    ...T.label,
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 1.4,
  },
  friendsTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  friendsText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#24C789',
    letterSpacing: 0.2,
  },

  // Control zone
  // ─── Pre-run controls ─────────────────────────────────────────────────
  // Clean hierarchy: visibility chips → GO button, no orphaned sections.
  preRunWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 20,
  },
  scopeRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  scopeChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 17,
  },
  scopeChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  scopeChipText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#9AA0A6',
    letterSpacing: 0.2,
  },
  scopeChipTextActive: {
    fontFamily: FONT.bold,
    color: '#0B0F13',
  },
  goButton: {
    backgroundColor: '#0B0F13',
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontFamily: FONT.extraBold,
    fontSize: 20,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Legacy aliases kept for the running / finished / spectate states
  controlsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  circleStartButton: {
    backgroundColor: '#0B0F13',
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  circleStartText: {
    color: '#FFFFFF',
    fontFamily: FONT.extraBold,
    fontSize: 20,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // ─── Fixed PAUSE button (active-run only) ────────────────────────────
  // Rendered OUTSIDE the animated sliding panel so the Pause affordance is
  // always thumb-reachable while the phone is in-hand. Only shown while
  // actively running — when paused, Resume/Stop live inside the expanded
  // panel as circular buttons, not as a bottom-floating row.
  //
  // bottom is measured inside the Run tab's content area (above the tab
  // bar island). 72pt keeps it sitting ~one thumb's reach above the dock
  // on iPhone PWA where the URL bar still adds 80-120pt of chrome.
  fixedControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 72,
    paddingHorizontal: 24,
  },
  fixedControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fixedControlsSingle: {
    flexDirection: 'row',
  },
  // Gap between the compact Keep-style data bar and the primary control
  // (Pause / Go) beneath it in the collapsed / active running layout.
  collapsedBarSpacing: {
    marginBottom: 12,
  },
  pauseBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F13',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  resumeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#24C789',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  stopBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF5A36',
    shadowColor: '#FF5A36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  fixedBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT.extraBold,
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  // ─── Paused-state circular controls (Figma round-button style) ───────
  // Sits INSIDE the dashboard panel under RunLivePanel. Two big round
  // buttons so the thumb always lands on one — no more overlap with the
  // pace chart.
  pausedCircleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
    paddingTop: 16,
    paddingBottom: 4,
  },
  pausedCircleLabel: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: '#6B6F76',
    textTransform: 'uppercase',
    marginTop: 8,
    textAlign: 'center',
  },
  pausedCircleStack: {
    alignItems: 'center',
  },
  resumeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#24C789',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  stopCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(11,15,19,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  stopCircleInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#FF5A36',
  },
  // Legacy aliases kept for spectate mode Done button
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    gap: 14,
  },
  circlePauseButton: {
    backgroundColor: '#0B0F13',
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleResumeButton: {
    backgroundColor: '#24C789',
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleStopButton: {
    backgroundColor: '#FF5A36',
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonText: {
    color: '#FFFFFF',
    fontFamily: FONT.extraBold,
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  // Spectator cheer tray
  spectatorTray: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    gap: 10,
  },
  spectatorCheerBtn: {
    backgroundColor: '#F4F5F7',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spectatorCheerEmoji: {
    fontSize: 22,
  },
  spectatorMessageBtn: {
    backgroundColor: '#0B0F13',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spectatorPhotoBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E6EA',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Spectator cheer drawer styles
  spectateMainAction: {
    backgroundColor: '#0B0F13',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 8,
    height: 48,
    borderRadius: 24,
    marginHorizontal: 40,
    marginTop: 10,
  },
  spectateMainActionText: {
    color: '#FFFFFF',
    fontFamily: FONT.bold,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  spectateGrid: {
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    gap: 12,
  },
  spectateGridTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spectateGridEmojiBtn: {
    backgroundColor: '#F4F5F7',
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  spectateGridEmoji: {
    fontSize: 26,
  },
  spectateGridBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  spectateGridActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E6EA',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  spectateGridActionText: {
    color: '#0B0F13',
    fontFamily: FONT.semibold,
    fontSize: 14,
  },
  spectateCloseBtn: {
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },

  cheerButton: {
    backgroundColor: '#F4F5F7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  cheerButtonText: {
    color: '#0B0F13',
    fontFamily: FONT.semibold,
    fontSize: 14,
  },

  // Web map overlay (live coords chip)
  webMapOverlayCard: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    zIndex: 10,
    alignItems: 'flex-end',
  },
  webMapOverlayText: {
    fontFamily: FONT.extraBold,
    color: '#0B0F13',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  webMapOverlayCoords: {
    fontFamily: FONT.medium,
    color: '#6B6F76',
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // ─── Glance pill (Scheme A — minimal running UI) ─────────────────────
  // Floating top-of-screen read-out shown only while actively running.
  // Three columns (km · time · pace) so the user gets one-glance answer
  // without unfolding the bottom panel.
  glancePill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 22 : 36,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,15,19,0.92)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    zIndex: 150,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  glancePillBelowBanner: {
    // Push down a bit when the demo banner is showing in the same area
    top: Platform.OS === 'ios' ? 92 : Platform.OS === 'web' ? 56 : 68,
  },
  glancePillCol: {
    alignItems: 'center',
    minWidth: 64,
  },
  glancePillValue: {
    fontFamily: FONT.extraBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  glancePillLabel: {
    fontFamily: FONT.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.4,
    marginTop: 2,
  },
  glancePillSep: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 14,
  },
  // Demo mode pill
  demoBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0B0F13',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 200,
    opacity: 0.85,
  },
  demoBannerText: {
    fontFamily: FONT.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ─── Demo-mode "sender toast" ────────────────────────────────────────
  // Slim pill that appears under the demo banner when an inbound demo
  // cheer arrives (solo) or when a demo runner replies to your cheer
  // (spectate). 2.4s fade handled in JS.
  senderToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 68,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(11,15,19,0.10)',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 250,
    maxWidth: '88%',
  },
  senderToastBelowBanner: {
    top: Platform.OS === 'ios' ? 92 : 70,
  },
  senderToastEmoji: {
    fontSize: 18,
  },
  senderToastText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#0B0F13',
    flexShrink: 1,
  },
  senderToastName: {
    fontFamily: FONT.bold,
  },

  // ─── Demo "Spectate a friend" chips (pre-run panel) ──────────────────
  demoSpectateRow: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 10,
  },
  demoSpectateLabel: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  demoSpectateChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  demoSpectateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  demoSpectateChipAvatar: {
    fontSize: 16,
  },
  demoSpectateChipName: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#0B0F13',
  },
  demoSpectateChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
