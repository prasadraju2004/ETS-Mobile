import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, Path, Text as SvgText, G, Rect } from "react-native-svg";
import { client } from "../api/client";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedG = Animated.createAnimatedComponent(G);

// --- VISUAL CONFIGURATION ---
const SEAT_RADIUS = 10;
const SEAT_SELECTED_RADIUS = 12;

const COLORS = {
  AVAILABLE: "#171717", // Dark fill for available
  SOLD: "#334155",
  LOCKED: "#F59E0B",
  HELD: "#FBBF24",
  SELECTED: "#6366F1", // Purple
  ACCESSIBLE: "#22D3EE",
  BG: "#0F172A", // Dark background
  STROKE_DEFAULT: "#64748B", // Visible stroke
  STROKE_SELECTED: "#FFFFFF",
};

const SeatStatus = {
  AVAILABLE: "AVAILABLE",
  HELD: "HELD",
  LOCKED: "LOCKED",
  SOLD: "SOLD",
  BLOCKED: "BLOCKED",
};

// Helper: Calculate center of section
const getPolygonCentroid = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let x = 0,
    y = 0;
  points.forEach((p) => {
    x += p.x;
    y += p.y;
  });
  return { x: x / points.length, y: y / points.length };
};

// Helper: robust ID extraction (handles { "$oid": ... } and standard _id)
const getSafeId = (data) => {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.$oid) return data.$oid;
  if (data.id) return data.id;
  if (data._id) return getSafeId(data._id);
  return null;
};

// --- MEMOIZED COMPONENTS ---
const SectionComponent = React.memo(({ section }) => (
  <Path
    d={section.d}
    fill="none"
    stroke={section.stroke}
    strokeWidth={2}
    strokeOpacity={0.5}
  />
));

const SeatComponent = React.memo(
  ({ item, isSelected, onPress }) => {
    let fill = COLORS.AVAILABLE;
    let stroke = COLORS.STROKE_DEFAULT;
    let strokeWidth = 1;
    let r = SEAT_RADIUS;
    const size = r * 2;

    if (isSelected) {
      fill = COLORS.SELECTED;
      stroke = COLORS.STROKE_SELECTED;
      strokeWidth = 2;
    } else if (item.status === SeatStatus.SOLD) {
      fill = COLORS.SOLD;
      stroke = "none";
    } else if (
      item.status === SeatStatus.LOCKED ||
      item.status === SeatStatus.BLOCKED
    ) {
      fill = COLORS.LOCKED;
      stroke = "none";
    }

    return (
      <G onPressIn={() => onPress(item)}>
        <Rect
          x={item.x - r}
          y={item.y - r}
          width={size}
          height={size}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {item.isAccessible && !isSelected && (
          <Circle cx={item.x} cy={item.y} r={3} fill="#FFF" />
        )}
        <SvgText
          x={item.x}
          y={item.y + 1}
          fill={
            isSelected || item.status === SeatStatus.SOLD ? "#FFF" : "#94A3B8"
          }
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {item.seatNumber}
        </SvgText>
      </G>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.item.status === next.item.status &&
      prev.item.price === next.item.price &&
      prev.item.x === next.item.x &&
      prev.item.y === next.item.y
    );
  },
);

// --- COUNTDOWN TIMER ---
const HoldTimer = ({ expiryTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiryTime) return;

    const update = () => {
      const now = new Date();
      const end = new Date(expiryTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        if (onExpire) onExpire();
        return false;
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s < 10 ? "0" + s : s}`);
        return true;
      }
    };

    if (!update()) return;

    const interval = setInterval(() => {
      if (!update()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  if (!expiryTime || timeLeft === "00:00") return null;

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={20} color="#FFF" />
      <Text style={styles.timerText}>Seats held for {timeLeft}</Text>
    </View>
  );
};

export default function SeatingScreen({ route, navigation }) {
  const { event } = route.params || {};
  const { user } = useContext(AuthContext);

  // Data State
  const [eventDetails, setEventDetails] = useState(event || null);
  const [venue, setVenue] = useState(null);
  const [seats, setSeats] = useState([]);
  const [customerId, setCustomerId] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());

  // --- ZOOM / PAN STATE ---
  const animScale = useRef(new Animated.Value(1)).current;
  const animTranslateX = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;

  const [mapLayout, setMapLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Gesture Refs
  const scaleRef = useRef(1);
  const minScaleRef = useRef(0.5); // New ref for minimum scale
  const lastScaleRef = useRef(1);
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const initialDistanceRef = useRef(0);
  const isPinchingRef = useRef(false);
  const mapViewRef = useRef(null);

  // Data Refs
  const seatsRef = useRef([]);
  const handlerRef = useRef(() => {});

  useEffect(() => {
    handlerRef.current = handleSeatPress;
  }, [handleSeatPress]);

  useEffect(() => {
    seatsRef.current = renderedSeats;
  }, [renderedSeats]);

  // --- PAN RESPONDER ---
  const calcDistance = (e) => {
    const t0 = e.nativeEvent.touches[0];
    const t1 = e.nativeEvent.touches[1];
    const dx = t0.pageX - t1.pageX;
    const dy = t0.pageY - t1.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 5 || Math.abs(dy) > 5;
      },
      onPanResponderGrant: (e) => {
        if (e.nativeEvent.touches.length === 2) {
          isPinchingRef.current = true;
          initialDistanceRef.current = calcDistance(e);
        } else {
          isPinchingRef.current = false;
        }
      },
      onPanResponderMove: (e, gestureState) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          const dist = calcDistance(e);
          if (!isPinchingRef.current) {
            isPinchingRef.current = true;
            initialDistanceRef.current = dist;
            lastScaleRef.current = scaleRef.current;
          }
          if (initialDistanceRef.current > 0) {
            const factor = dist / initialDistanceRef.current;
            const newScale = Math.max(
              minScaleRef.current,
              Math.min(3, lastScaleRef.current * factor),
            );
            scaleRef.current = newScale;
            animScale.setValue(newScale);
          }
        } else if (touches.length === 1 && !isPinchingRef.current) {
          const newX = lastOffsetRef.current.x + gestureState.dx;
          const newY = lastOffsetRef.current.y + gestureState.dy;
          offsetRef.current = { x: newX, y: newY };
          animTranslateX.setValue(newX);
          animTranslateY.setValue(newY);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (
          Math.abs(gestureState.dx) < 10 &&
          Math.abs(gestureState.dy) < 10 &&
          !isPinchingRef.current
        ) {
          // Use locationX/Y if available for better accuracy relative to the view
          const locX = e.nativeEvent.locationX;
          const locY = e.nativeEvent.locationY;

          const tx = offsetRef.current.x;
          const ty = offsetRef.current.y;
          const s = scaleRef.current;

          const worldX = (locX - tx) / s;
          const worldY = (locY - ty) / s;

          const TOUCH_THRESHOLD = 60;
          let closest = null;
          let minDist = Infinity;

          for (const seat of seatsRef.current) {
            const distSq = (seat.x - worldX) ** 2 + (seat.y - worldY) ** 2;
            if (distSq < minDist) {
              minDist = distSq;
              closest = seat;
            }
          }

          console.log(
            `Touch at ${Math.round(worldX)}, ${Math.round(worldY)}. Closest: ${closest?.seatNumber}, dist: ${Math.sqrt(minDist)}`,
          );

          if (closest && minDist < TOUCH_THRESHOLD ** 2) {
            handlerRef.current(closest);
          }
        }

        if (e.nativeEvent.touches.length < 2) isPinchingRef.current = false;
        if (e.nativeEvent.touches.length === 0) {
          lastOffsetRef.current = offsetRef.current;
          lastScaleRef.current = scaleRef.current;
        }
      },
      onPanResponderTerminate: () => {
        isPinchingRef.current = false;
        lastOffsetRef.current = offsetRef.current;
        lastScaleRef.current = scaleRef.current;
      },
    }),
  ).current;

  // --- ZOOM ACTIONS ---
  const handleZoomIn = () => {
    const newScale = Math.min(3, scaleRef.current * 1.5);
    scaleRef.current = newScale;
    lastScaleRef.current = newScale;
    Animated.spring(animScale, {
      toValue: newScale,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();
  };

  const handleZoomOut = () => {
    // Zoom out only to the minimum fitted scale
    const newScale = Math.max(minScaleRef.current, scaleRef.current / 1.5);
    scaleRef.current = newScale;
    lastScaleRef.current = newScale;
    Animated.spring(animScale, {
      toValue: newScale,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();
  };

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        setLoading(true);
        const eventId = getSafeId(event);
        if (!eventId) throw new Error("No Event ID");

        const eventRes = await client.get(`/events/${eventId}`);
        if (isMounted) setEventDetails(eventRes.data);

        const venueId = getSafeId(eventRes.data.venueId);
        if (!venueId) throw new Error("Venue missing");

        const venueRes = await client.get(`/venue/${venueId}`);
        if (isMounted) {
          const vData = venueRes.data;
          setVenue(vData);

          // Calculate Bounding Box
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

          const processPoints = (points) => {
            points.forEach((p) => {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            });
          };

          if (vData.sections) {
            vData.sections.forEach((sec) => {
              if (sec.seats) processPoints(sec.seats);
              if (sec.boundary) processPoints(sec.boundary);
            });
          }

          // Fallback if no specific bounds found
          if (minX === Infinity) {
            minX = 0;
            maxX = 2000;
          }
          if (minY === Infinity) {
            minY = 0;
            maxY = 2000;
          }

          // Add padding
          const PADDING = 50;
          minX -= PADDING;
          maxX += PADDING;
          minY -= PADDING;
          maxY += PADDING;

          const contentW = maxX - minX;
          const contentH = maxY - minY;
          const contentCenterX = (minX + maxX) / 2;
          const contentCenterY = (minY + maxY) / 2;
          const availableH = SCREEN_HEIGHT * 0.75;
          const scaleW = SCREEN_WIDTH / contentW;
          const scaleH = availableH / contentH;
          const fitScale = Math.min(scaleW, scaleH) * 0.95;

          minScaleRef.current = fitScale; // Store min scale
          scaleRef.current = fitScale;
          lastScaleRef.current = fitScale;
          animScale.setValue(fitScale);

          offsetRef.current = { x: 0, y: 0 };
          lastOffsetRef.current = { x: 0, y: 0 };
          animTranslateX.setValue(0);
          animTranslateY.setValue(0);

          // Store map layout for debug/tap usage
          setMapLayout({
            x: 0,
            y: 0,
            width: SCREEN_WIDTH,
            height: availableH,
            contentBounds: { minX, minY, maxX, maxY },
          });
        }

        // Fetch seats
        const seatsRes = await client.get(`/event-seats/event/${eventId}`);
        const seatsData = seatsRes.data.seats || seatsRes.data || [];

        if (seatsData.length === 0) {
          console.warn("⚠️ NO SEATS RETURNED FROM BACKEND!");
        }

        if (isMounted) setSeats(seatsData);

        const uid = getSafeId(user);
        if (uid) {
          try {
            const custRes = await client.get(`/customers/user/${uid}`);
            if (isMounted) setCustomerId(getSafeId(custRes.data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("SeatingScreen Init Error:", err);
        const url = err.config?.url || "unknown URL";
        const status = err.response?.status || "unknown status";
        const message = `Failed at ${url} (${status}): ${err.message}`;
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [event?.id, user?._id]);

  // --- 2. WEBSOCKET CONNECTION ---
  useEffect(() => {
    const eid = getSafeId(event);
    if (!eid) return;

    // Use the same base URL as the axios client
    const socket = io(client.defaults.baseURL.replace("/api", ""), {
      transports: ["websocket"],
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      socket.emit("join-event", eid);
    });

    socket.on("seatStatusChanged", ({ seatId, status }) => {
      console.log(`Seat ${seatId} changed to ${status}`);
      setSeats((currentSeats) =>
        currentSeats.map((s) =>
          getSafeId(s) === seatId ? { ...s, status } : s,
        ),
      );

      // If a seat becomes unavailable, remove it from selection locally
      if (status !== SeatStatus.AVAILABLE && status !== SeatStatus.LOCKED) {
        setSelectedSeatIds((prev) => {
          const next = new Set(prev);
          if (next.has(seatId)) {
            next.delete(seatId);
            return next;
          }
          return prev;
        });
      }
    });

    return () => {
      socket.emit("leave-event", eid);
      socket.disconnect();
    };
  }, [event]);

  // --- 3. POLL SEATS (Backup) ---
  useEffect(() => {
    const eid = getSafeId(event);
    if (!eid) return;
    const interval = setInterval(async () => {
      try {
        const res = await client.get(`/event-seats/event/${eid}`);
        const seatsData = res.data.seats || res.data || [];
        if (res.data.seats) setSeats(seatsData);
      } catch (err) {
        const url = err.config?.url || "unknown URL";
        console.warn(`Poll error at ${url}: ${err.message}`);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- 3. MERGE DATA ---
  const PALETTE = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
  ];

  const { renderedSeats, renderedSections } = useMemo(() => {
    if (!venue || !venue.sections)
      return { renderedSeats: [], renderedSections: [] };

    const liveSeatMap = new Map();
    seats.forEach((s) => {
      liveSeatMap.set(`${s.sectionId}-${s.row}-${s.seatNumber}`, s);
    });

    const outputSeats = [];
    const outputSections = [];

    venue.sections.forEach((section, index) => {
      const secId = section.id || section.sectionId;
      const sectionColor = section.color || PALETTE[index % PALETTE.length];

      if (section.boundary?.length) {
        const centroid = getPolygonCentroid(section.boundary);
        const pathData =
          section.boundary
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ") + " Z";
        outputSections.push({
          key: secId,
          d: pathData,
          fill: sectionColor,
          stroke: sectionColor,
          label: section.name,
          centroid,
        });
      }

      if (!section.seats) {
        console.log(`Section ${secId} has no seats array!`);
        return;
      }

      section.seats.forEach((layoutSeat, idx) => {
        const seatNum =
          layoutSeat.num !== undefined
            ? layoutSeat.num
            : layoutSeat.number !== undefined
              ? layoutSeat.number
              : layoutSeat.seatNumber !== undefined
                ? layoutSeat.seatNumber
                : `idx-${idx}`;
        const key = `${secId}-${layoutSeat.row}-${seatNum}`;
        const liveSeat = liveSeatMap.get(key);

        outputSeats.push({
          key,
          _id: liveSeat ? liveSeat._id : `virtual-${key}`,
          x: layoutSeat.x,
          y: layoutSeat.y,
          status: liveSeat ? liveSeat.status : "UNKNOWN",
          price: liveSeat?.price || 0,
          lockedBy: liveSeat?.lockedBy,
          holdExpiresAt: liveSeat?.holdExpiresAt,
          sectionColor: sectionColor,
          isAccessible: layoutSeat.type === "ACCESSIBLE",
          row: layoutSeat.row,
          seatNumber: seatNum,
        });
      });
    });

    return { renderedSeats: outputSeats, renderedSections: outputSections };
  }, [venue, seats]);

  // --- 4. SELECTION / EXPIRY LOGIC ---
  const earliestExpiry = useMemo(() => {
    let minTime = null;
    selectedSeatIds.forEach((id) => {
      const s = seats.find((x) => getSafeId(x) === id);
      if (s && s.holdExpiresAt) {
        const t = new Date(s.holdExpiresAt).getTime();
        if (!minTime || t < minTime) minTime = t;
      }
    });
    return minTime ? new Date(minTime) : null;
  }, [seats, selectedSeatIds]);

  // Sync selectedSeatIds with actual 'LOCKED' status
  useEffect(() => {
    // If no user, clear selections immediately
    if (!user) {
      if (selectedSeatIds.size > 0) {
        setSelectedSeatIds(new Set());
      }
      return;
    }

    const uid = getSafeId(user);
    const newSelected = new Set();

    seats.forEach((s) => {
      const lockedBy = getSafeId(s.lockedBy);
      // Only select seats that are LOCKED by THIS user
      if (
        s.status === SeatStatus.LOCKED &&
        (lockedBy === uid || lockedBy === customerId)
      ) {
        newSelected.add(getSafeId(s));
      }
    });

    // Only update if size changes to avoid loops, or if checks imply divergence
    if (newSelected.size !== selectedSeatIds.size) {
      setSelectedSeatIds(newSelected);
    } else {
      // If sizes match, check if content is different
      let isDiff = false;
      for (let id of newSelected) {
        if (!selectedSeatIds.has(id)) {
          isDiff = true;
          break;
        }
      }
      if (isDiff) setSelectedSeatIds(newSelected);
    }
  }, [seats, user, customerId]);

  const totalPrice = useMemo(() => {
    let total = 0;
    selectedSeatIds.forEach((id) => {
      const s = seats.find((x) => getSafeId(x) === id);
      if (s) {
        if (s.price) total += s.price;
      }
    });
    return total;
  }, [selectedSeatIds, seats]);

  const selectedSeatLabels = useMemo(() => {
    const labels = Array.from(selectedSeatIds)
      .map((id) => {
        const s = seats.find((x) => getSafeId(x) === id);
        return s ? `${s.row}-${s.seatNumber}` : "";
      })
      .filter((l) => l)
      .sort();

    if (labels.length === 0) return "";
    if (labels.length > 5)
      return `${labels.slice(0, 5).join(", ")} +${labels.length - 5}`;
    return labels.join(", ");
  }, [selectedSeatIds, seats]);

  const handleSeatPress = useCallback(
    async (seatItem) => {
      // 1. Prevent multiple concurrent actions
      if (isLocking) return;

      const seatId = getSafeId(seatItem);
      if (!seatId || seatId.startsWith("virtual")) return;

      // 2. Login Check
      if (!user && !customerId) {
        Alert.alert("Login Required", "Please log in to select seats.");
        return;
      }

      const isSelected = selectedSeatIds.has(seatId);

      // 3. Status Validation (only if selecting)
      if (
        !isSelected &&
        seatItem.status !== SeatStatus.AVAILABLE &&
        seatItem.status !== "UNKNOWN"
      ) {
        return;
      }

      // 4. Optimistic Update
      setIsLocking(true);

      const prevSelected = new Set(selectedSeatIds);
      if (isSelected) {
        prevSelected.delete(seatId);
        console.log(`Unselected seat ${seatItem.seatNumber}`);
      } else {
        prevSelected.add(seatId);
        console.log(`Selected seat ${seatItem.seatNumber}`);
      }
      setSelectedSeatIds(prevSelected);

      try {
        if (isSelected) {
          // UNLOCK ACTION
          await client.post("/event-seats/unlock-seat", {
            eventSeatId: seatId,
            userId: customerId || getSafeId(user),
          });

          setSeats((current) =>
            current.map((s) =>
              getSafeId(s) === seatId
                ? { ...s, status: SeatStatus.AVAILABLE }
                : s,
            ),
          );
        } else {
          // LOCK ACTION
          await client.post("/event-seats/lock-seat", {
            eventSeatId: seatId,
            userId: customerId || getSafeId(user),
          });

          setSeats((current) =>
            current.map((s) =>
              getSafeId(s) === seatId
                ? { ...s, status: SeatStatus.LOCKED, lockedBy: getSafeId(user) }
                : s,
            ),
          );
        }
      } catch (err) {
        console.log("Action failed:", err.message);
        Alert.alert("Error", err.message || "Failed to update seat.");

        // Revert Optimistic Update
        setSelectedSeatIds((prev) => {
          const next = new Set(prev);
          if (isSelected) next.add(seatId);
          else next.delete(seatId);
          return next;
        });

        const evtId = getSafeId(eventDetails);
        if (evtId) {
          client.get(`/event-seats/event/${evtId}`).then((res) => {
            if (res.data.seats) setSeats(res.data.seats);
          });
        }
      } finally {
        setIsLocking(false);
      }
    },
    [selectedSeatIds, user, customerId, eventDetails, isLocking],
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{venue?.name || "Event Venue"}</Text>
          <Text style={styles.headerSub}>{eventDetails?.name}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#1E293B"
          />
        </TouchableOpacity>
      </View>

      {/* OVERLAY for smooth feedback logic */}
      {isLocking && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Updating...</Text>
        </View>
      )}

      {/* TIMER */}
      {earliestExpiry && (
        <View style={styles.timerBar}>
          <HoldTimer
            expiryTime={earliestExpiry}
            onExpire={() => {
              Alert.alert(
                "Time Expired",
                "Your held seats have been released.",
              );
              setSelectedSeatIds(new Set());
              client
                .get(`/event-seats/event/${getSafeId(eventDetails)}`)
                .then((r) => {
                  if (r.data.seats) setSeats(r.data.seats);
                });
            }}
          />
        </View>
      )}

      {/* LEGEND */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.AVAILABLE }]}
          />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.SELECTED }]}
          />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.SOLD }]} />
          <Text style={styles.legendText}>Sold</Text>
        </View>
      </View>

      {/* MAP */}
      <View
        ref={mapViewRef}
        style={styles.mapWrapper}
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          // Also try to measure absolute position
          if (mapViewRef.current) {
            mapViewRef.current.measure((fx, fy, width, height, px, py) => {
              setMapLayout({
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                pageX: px,
                pageY: py,
              });
            });
          } else {
            setMapLayout(layout);
          }
        }}
        {...panResponder.panHandlers}
      >
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <AnimatedG
            style={{
              transform: [
                { scale: animScale },
                { translateX: animTranslateX },
                { translateY: animTranslateY },
              ],
            }}
          >
            {/* STAGE */}
            {/* STAGE / SCREEN */}
            {venue?.stagePosition && (
              <G>
                {/* Curved Screen Effect */}
                <Path
                  d={`M ${venue.stagePosition.x - 150} ${venue.stagePosition.y} Q ${venue.stagePosition.x} ${venue.stagePosition.y - 40} ${venue.stagePosition.x + 150} ${venue.stagePosition.y}`}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth={4}
                  strokeOpacity={0.6}
                />
                {/* Glow/Shadow */}
                <Path
                  d={`M ${venue.stagePosition.x - 140} ${venue.stagePosition.y + 10} Q ${venue.stagePosition.x} ${venue.stagePosition.y - 20} ${venue.stagePosition.x + 140} ${venue.stagePosition.y + 10}`}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth={20}
                  strokeOpacity={0.1}
                />
                <SvgText
                  x={venue.stagePosition.x}
                  y={venue.stagePosition.y + 25}
                  fill="#6366F1"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  letterSpacing="3"
                >
                  SCREEN THIS WAY
                </SvgText>
              </G>
            )}

            {/* SECTIONS */}
            {renderedSections.map((section) => (
              <SectionComponent key={section.key} section={section} />
            ))}

            {/* SEATS */}
            {renderedSeats.map((item) => (
              <SeatComponent
                key={item.key}
                item={item}
                isSelected={selectedSeatIds.has(item._id)}
                onPress={handleSeatPress}
              />
            ))}
          </AnimatedG>
        </Svg>
      </View>

      {/* ZOOM CONTROLS */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Ionicons name="add" size={24} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Ionicons name="remove" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      {selectedSeatIds.size > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerLabel}>
                {selectedSeatLabels || `${selectedSeatIds.size} Ticket(s)`}
              </Text>
              <Text style={styles.footerPrice}>₹{totalPrice}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, isLocking && styles.btnDisabled]}
              disabled={isLocking}
              onPress={() =>
                Alert.alert("Payment", "Proceeding to Payment Gateway...")
              }
            >
              {isLocking ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.checkoutBtnText}>Pay Now</Text>
                  <MaterialIcons name="navigate-next" size={24} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#EF4444", fontSize: 16 },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTextContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B" },
  iconBtn: { padding: 8 },

  zoomControls: {
    position: "absolute",
    right: 20,
    top: 120,
    zIndex: 50,
  },
  zoomBtn: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, color: "#475569", fontWeight: "600" },

  timerBar: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 6,
  },

  mapWrapper: { flex: 1, backgroundColor: "#F1F5F9" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  footerPrice: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  checkoutBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  btnDisabled: { opacity: 0.7 },
  checkoutBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 4,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    color: "#4F46E5",
    fontWeight: "bold",
  },
});
