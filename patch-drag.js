const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// Import PanResponder
code = code.replace(
  "LayoutAnimation,",
  "LayoutAnimation,\n  PanResponder,"
);

// We will inject the PanResponder into the RunScreen component
const injectCode = `
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if moving vertically more than horizontally
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          // Dragged down
          Animated.spring(panY, {
            toValue: 200, // Move it down
            useNativeDriver: false,
          }).start(() => setIsPanelCollapsed(true));
        } else if (gestureState.dy < -50) {
          // Dragged up
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => setIsPanelCollapsed(false));
        } else {
          // Revert to original state
          Animated.spring(panY, {
            toValue: isPanelCollapsed ? 200 : 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // React to programmatic toggle (clicking the bar)
  useEffect(() => {
    Animated.spring(panY, {
      toValue: isPanelCollapsed ? 200 : 0,
      useNativeDriver: false,
    }).start();
  }, [isPanelCollapsed]);

  const togglePanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPanelCollapsed(!isPanelCollapsed);
  };
`;

code = code.replace(
  "const togglePanel = () => {\n    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);\n    setIsPanelCollapsed(!isPanelCollapsed);\n  };",
  injectCode
);

// Update the JSX to use Animated.View and apply panResponder
code = code.replace(
  "<View style={[styles.dashboardContainer, isPanelCollapsed && styles.dashboardCollapsed]}>",
  "<Animated.View style={[styles.dashboardContainer, { transform: [{ translateY: panY }] }]} {...panResponder.panHandlers}>"
);

code = code.replace(
  "        </View>\n      </View>\n    </View>",
  "        </View>\n      </Animated.View>\n    </View>"
);

fs.writeFileSync('screens/RunScreen.js', code);
