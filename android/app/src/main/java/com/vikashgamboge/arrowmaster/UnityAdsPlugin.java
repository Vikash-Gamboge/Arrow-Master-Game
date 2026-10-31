package com.vikashgamboge.arrowmaster;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsLoadOptions;
import com.unity3d.ads.UnityAdsShowOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "UnityAdsPlugin")
public class UnityAdsPlugin extends Plugin {

    private static final String TAG = "UnityAdsPlugin";

    // Exact Unity Dashboard Values (Rewarded & Interstitial only - Zero Banner Ads)
    private static final String DEFAULT_GAME_ID = "800417555";
    private static final String REWARDED_PLACEMENT = "BP_Rewarded_Android";
    private static final String INTERSTITIAL_PLACEMENT = "BP_Interstitial_Android";

    private final AtomicBoolean isInitializing = new AtomicBoolean(false);
    private final AtomicBoolean isShowingAd = new AtomicBoolean(false);

    private final Set<String> loadedPlacements = Collections.synchronizedSet(new HashSet<>());
    private final Set<String> loadingPlacements = Collections.synchronizedSet(new HashSet<>());
    private final Map<String, String> loadedObjectIds = new ConcurrentHashMap<>();
    private final Map<String, String> lastLoadErrors = new ConcurrentHashMap<>();

    private final List<PluginCall> pendingInitCalls = Collections.synchronizedList(new ArrayList<>());
    private final List<Runnable> pendingAfterInitTasks = Collections.synchronizedList(new ArrayList<>());
    private final Map<String, List<PluginCall>> pendingLoadCalls = new HashMap<>();

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService adLoadExecutor = Executors.newCachedThreadPool();

    private volatile String activeGameId = DEFAULT_GAME_ID;
    private volatile boolean activeTestMode = true;
    private volatile String lastInitError = null;
    private volatile JSONObject cachedPublisherConfig = null;
    private volatile long cachedPublisherConfigTs = 0L;
    private final long gameSessionId = Math.abs(UUID.randomUUID().getMostSignificantBits());

    @Override
    public void load() {
        super.load();
        mainHandler.post(() -> startNativeInitialization(DEFAULT_GAME_ID, true, null));
    }

    /**
     * Ensures the native Unity Ads SDK always receives the exact Dashboard placement IDs:
     * BP_Rewarded_Android or BP_Interstitial_Android (never stripping the BP_ prefix).
     */
    private String normalizePlacementId(String requestedPlacement) {
        if (requestedPlacement == null || requestedPlacement.trim().isEmpty()) {
            return REWARDED_PLACEMENT;
        }
        String trimmed = requestedPlacement.trim();
        if (INTERSTITIAL_PLACEMENT.equalsIgnoreCase(trimmed)) {
            return INTERSTITIAL_PLACEMENT;
        }
        if (REWARDED_PLACEMENT.equalsIgnoreCase(trimmed)) {
            return REWARDED_PLACEMENT;
        }
        return trimmed;
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        String gameId = call.getString("gameId", DEFAULT_GAME_ID);
        Boolean testMode = call.getBoolean("testMode", true);

        if (gameId == null || gameId.trim().isEmpty()) {
            gameId = DEFAULT_GAME_ID;
        }

        final String finalGameId = gameId.trim();
        final boolean finalTestMode = testMode != null ? testMode : true;

        mainHandler.post(() -> startNativeInitialization(finalGameId, finalTestMode, call));
    }

    private void startNativeInitialization(String gameId, boolean testMode, PluginCall call) {
        this.activeGameId = gameId;
        this.activeTestMode = testMode;

        if (UnityAds.isInitialized()) {
            Log.d(TAG, "Unity Ads is already initialized (version " + UnityAds.getVersion() + ")");
            preloadStandardPlacements();
            drainPendingAfterInitTasks();
            if (call != null) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("alreadyInitialized", true);
                ret.put("sdkVersion", UnityAds.getVersion());
                call.resolve(ret);
            }
            return;
        }

        if (call != null) {
            pendingInitCalls.add(call);
        }

        if (isInitializing.getAndSet(true)) {
            Log.d(TAG, "Unity Ads initialization already in progress; queued caller.");
            return;
        }

        Log.i(TAG, "Initializing Unity Ads SDK v" + UnityAds.getVersion() + " with Game ID: " + gameId + ", testMode: " + testMode);
        Context initContext = getActivity() != null ? getActivity() : getContext().getApplicationContext();

        // Warm up publisher configuration cache in parallel
        adLoadExecutor.execute(() -> getOrFetchPublisherConfig(gameId, testMode));

        try {
            UnityAds.initialize(initContext, gameId, testMode, new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    isInitializing.set(false);
                    lastInitError = null;
                    Log.i(TAG, "Unity Ads Initialization Completed Successfully");

                    JSObject eventData = new JSObject();
                    eventData.put("initialized", true);
                    eventData.put("gameId", gameId);
                    eventData.put("sdkVersion", UnityAds.getVersion());
                    notifyListeners("sdkInitialized", eventData);

                    synchronized (pendingInitCalls) {
                        for (PluginCall pending : pendingInitCalls) {
                            try {
                                JSObject ret = new JSObject();
                                ret.put("success", true);
                                ret.put("sdkVersion", UnityAds.getVersion());
                                pending.resolve(ret);
                            } catch (Exception ignored) {}
                        }
                        pendingInitCalls.clear();
                    }

                    // Process queued ad load requests from onInitializationComplete()
                    drainPendingAfterInitTasks();
                    preloadStandardPlacements();
                }

                @Override
                public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                    isInitializing.set(false);
                    lastInitError = error.name() + ": " + message;
                    Log.e(TAG, "Unity Ads Initialization Failed [" + error.name() + "]: " + message);

                    JSObject eventData = new JSObject();
                    eventData.put("initialized", false);
                    eventData.put("errorCode", error.name());
                    eventData.put("message", message);
                    notifyListeners("sdkInitFailed", eventData);

                    synchronized (pendingInitCalls) {
                        for (PluginCall pending : pendingInitCalls) {
                            try {
                                pending.reject("INIT_FAILED", "Unity Ads Initialization Error [" + error.name() + "]: " + message);
                            } catch (Exception ignored) {}
                        }
                        pendingInitCalls.clear();
                    }

                    synchronized (pendingAfterInitTasks) {
                        pendingAfterInitTasks.clear();
                    }
                    rejectAllPendingLoads("INIT_FAILED", "Unity Ads Initialization Error [" + error.name() + "]: " + message);
                }
            });
        } catch (Exception e) {
            isInitializing.set(false);
            lastInitError = "EXCEPTION: " + e.getMessage();
            Log.e(TAG, "Unexpected error starting Unity Ads initialization", e);
            synchronized (pendingInitCalls) {
                for (PluginCall pending : pendingInitCalls) {
                    try {
                        pending.reject("INIT_FAILED", "Unexpected error initializing Unity Ads: " + e.getMessage());
                    } catch (Exception ignored) {}
                }
                pendingInitCalls.clear();
            }
            rejectAllPendingLoads("INIT_FAILED", "Unexpected error initializing Unity Ads: " + e.getMessage());
        }
    }

    private void drainPendingAfterInitTasks() {
        List<Runnable> tasks;
        synchronized (pendingAfterInitTasks) {
            tasks = new ArrayList<>(pendingAfterInitTasks);
            pendingAfterInitTasks.clear();
        }
        for (Runnable r : tasks) {
            mainHandler.post(r);
        }
    }

    private void rejectAllPendingLoads(String code, String message) {
        Map<String, List<PluginCall>> copy;
        synchronized (pendingLoadCalls) {
            copy = new HashMap<>(pendingLoadCalls);
            pendingLoadCalls.clear();
        }
        for (Map.Entry<String, List<PluginCall>> entry : copy.entrySet()) {
            lastLoadErrors.put(entry.getKey(), message);
            for (PluginCall c : entry.getValue()) {
                try {
                    c.reject(code, message);
                } catch (Exception ignored) {}
            }
        }
    }

    @PluginMethod
    public void isInitialized(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", UnityAds.isInitialized());
        ret.put("initializing", isInitializing.get());
        ret.put("sdkVersion", UnityAds.getVersion());
        if (lastInitError != null) {
            ret.put("error", lastInitError);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void loadAd(PluginCall call) {
        String requestedPlacement = call.getString("placementId", REWARDED_PLACEMENT);
        if (requestedPlacement == null || requestedPlacement.trim().isEmpty()) {
            call.reject("INVALID_ARGUMENT", "Placement ID is required");
            return;
        }

        final String placementId = normalizePlacementId(requestedPlacement);

        if (loadedPlacements.contains(placementId)) {
            Log.d(TAG, "Placement already loaded: " + placementId);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("placementId", placementId);
            ret.put("resolvedPlacementId", placementId);
            ret.put("alreadyLoaded", true);
            call.resolve(ret);
            return;
        }

        mainHandler.post(() -> {
            if (!UnityAds.isInitialized()) {
                Log.d(TAG, "Unity Ads not yet initialized when loadAd(" + placementId + ") called; queueing until onInitializationComplete.");
                synchronized (pendingLoadCalls) {
                    List<PluginCall> list = pendingLoadCalls.computeIfAbsent(placementId, k -> new ArrayList<>());
                    list.add(call);
                }
                pendingAfterInitTasks.add(() -> enqueueAndLoadPlacement(placementId, null, true));
                startNativeInitialization(activeGameId, activeTestMode, null);
                return;
            }

            enqueueAndLoadPlacement(placementId, call, true);
        });
    }

    private void enqueueAndLoadPlacement(
            final String placementId,
            final PluginCall call,
            final boolean useBiddingMarkupIfNeeded
    ) {
        if (loadedPlacements.contains(placementId)) {
            if (call != null) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("placementId", placementId);
                ret.put("resolvedPlacementId", placementId);
                call.resolve(ret);
            }
            return;
        }

        synchronized (pendingLoadCalls) {
            if (call != null) {
                List<PluginCall> list = pendingLoadCalls.computeIfAbsent(placementId, k -> new ArrayList<>());
                list.add(call);
            }
        }

        if (loadingPlacements.contains(placementId)) {
            Log.d(TAG, "Placement is already loading; queued callback for: " + placementId);
            return;
        }

        loadingPlacements.add(placementId);
        Log.i(TAG, "Preparing UnityAds.load for placement: " + placementId + " (useBiddingMarkup=" + useBiddingMarkupIfNeeded + ")");

        adLoadExecutor.execute(() -> {
            final String objectId = UUID.randomUUID().toString();
            final UnityAdsLoadOptions loadOptions = new UnityAdsLoadOptions();
            loadOptions.setObjectId(objectId);

            boolean attachedMarkup = false;
            if (useBiddingMarkupIfNeeded) {
                try {
                    String adMarkup = fetchBiddingAdMarkup(activeGameId, placementId, objectId, activeTestMode);
                    if (adMarkup != null && !adMarkup.isEmpty()) {
                        loadOptions.setAdMarkup(adMarkup);
                        attachedMarkup = true;
                        Log.d(TAG, "Attached bidding adMarkup for placement: " + placementId + " (objectId=" + objectId + ")");
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not prefetch bidding adMarkup for " + placementId + ", proceeding with standard loadOptions: " + e.getMessage());
                }
            }

            final boolean finalAttachedMarkup = attachedMarkup;

            mainHandler.post(() -> {
                try {
                    UnityAds.load(placementId, loadOptions, new IUnityAdsLoadListener() {
                        @Override
                        public void onUnityAdsAdLoaded(String pId) {
                            Log.i(TAG, "Unity Ad loaded successfully for: " + pId + " (objectId=" + objectId + ")");
                            loadingPlacements.remove(pId);
                            loadingPlacements.remove(placementId);

                            loadedObjectIds.put(pId, objectId);
                            loadedObjectIds.put(placementId, objectId);

                            loadedPlacements.add(pId);
                            loadedPlacements.add(placementId);
                            lastLoadErrors.remove(placementId);

                            JSObject eventData = new JSObject();
                            eventData.put("placementId", placementId);
                            eventData.put("resolvedPlacementId", pId);
                            eventData.put("loaded", true);
                            notifyListeners("adLoaded", eventData);

                            resolvePendingLoadCalls(placementId, pId);
                        }

                        @Override
                        public void onUnityAdsFailedToLoad(String pId, UnityAds.UnityAdsLoadError error, String message) {
                            Log.e(TAG, "Unity Ad failed to load for " + pId + " [" + error.name() + "]: " + message);
                            loadingPlacements.remove(pId);
                            loadingPlacements.remove(placementId);
                            loadedPlacements.remove(pId);
                            loadedPlacements.remove(placementId);

                            // If we attached bidding adMarkup and the placement was reconfigured as waterfall, retry once without adMarkup
                            if (finalAttachedMarkup && message != null && (message.contains("non-bidding") || message.contains("Could not parse Ad Markup"))) {
                                Log.i(TAG, "Retrying " + placementId + " without bidding adMarkup...");
                                mainHandler.post(() -> enqueueAndLoadPlacement(placementId, null, false));
                                return;
                            }

                            String errDetail = error.name() + ": " + message;
                            lastLoadErrors.put(placementId, errDetail);

                            JSObject eventData = new JSObject();
                            eventData.put("placementId", placementId);
                            eventData.put("resolvedPlacementId", pId);
                            eventData.put("loaded", false);
                            eventData.put("errorCode", error.name());
                            eventData.put("message", message);
                            notifyListeners("adLoadFailed", eventData);

                            rejectPendingLoadCalls(placementId, error.name(), "Unity Ads Load Error [" + error.name() + "]: " + message);
                        }
                    });
                } catch (Exception e) {
                    loadingPlacements.remove(placementId);
                    String errDetail = "EXCEPTION: " + e.getMessage();
                    lastLoadErrors.put(placementId, errDetail);
                    Log.e(TAG, "Exception during UnityAds.load for: " + placementId, e);
                    rejectPendingLoadCalls(placementId, "LOAD_EXCEPTION", "Exception loading ad: " + e.getMessage());
                }
            });
        });
    }

    /**
     * Fetches the Unity Publisher Configuration for Game ID 800417555 (cached for 10 minutes).
     */
    private synchronized JSONObject getOrFetchPublisherConfig(String gameId, boolean testMode) {
        long now = System.currentTimeMillis();
        if (cachedPublisherConfig != null && (now - cachedPublisherConfigTs) < 600_000L) {
            return cachedPublisherConfig;
        }

        HttpURLConnection conn = null;
        try {
            String bundleId = getContext() != null ? getContext().getPackageName() : "com.vikashgamboge.arrowmaster";
            String configUrl = "https://publisher-config.unityads.unity3d.com/games/"
                    + URLEncoder.encode(gameId, "UTF-8")
                    + "/configuration?platform=android&sdkVersion=41500&test="
                    + (testMode ? "true" : "false")
                    + "&bundleId=" + URLEncoder.encode(bundleId, "UTF-8");

            URL url = new URL(configUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4500);
            conn.setReadTimeout(4500);
            conn.setRequestProperty("Accept", "application/json");

            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                String body = readStream(conn.getInputStream());
                JSONObject json = new JSONObject(body);
                cachedPublisherConfig = json;
                cachedPublisherConfigTs = now;
                return json;
            } else {
                Log.w(TAG, "Publisher config HTTP status: " + status);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to fetch publisher config: " + e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
        return cachedPublisherConfig;
    }

    /**
     * When BP_Rewarded_Android or BP_Interstitial_Android in Game ID 800417555 is configured
     * with placementType="bidding", Unity Ads WebView runtime requires UnityAdsLoadOptions
     * to include both objectId and base64-encoded adMarkup from Unity's auction endpoint.
     */
    private String fetchBiddingAdMarkup(String gameId, String placementId, String objectId, boolean testMode) throws Exception {
        JSONObject pubConfig = getOrFetchPublisherConfig(gameId, testMode);
        if (pubConfig == null) {
            return null;
        }

        JSONObject targetPlacementObj = null;
        JSONArray placementsArr = pubConfig.optJSONArray("placements");
        if (placementsArr != null) {
            for (int i = 0; i < placementsArr.length(); i++) {
                JSONObject p = placementsArr.optJSONObject(i);
                if (p != null && placementId.equals(p.optString("id"))) {
                    targetPlacementObj = p;
                    break;
                }
            }
        }

        if (targetPlacementObj == null) {
            Log.w(TAG, "Placement " + placementId + " not found in publisher configuration.");
            return null;
        }

        String placementType = targetPlacementObj.optString("placementType", "bidding");
        if (!"bidding".equalsIgnoreCase(placementType)) {
            // Standard waterfall placement does not need adMarkup
            return null;
        }

        String auctionJson = requestUnityAuctionLoad(gameId, pubConfig, targetPlacementObj, objectId, testMode);
        if ((auctionJson == null || !auctionJson.contains("\"media\"")) && !testMode) {
            auctionJson = requestUnityAuctionLoad(gameId, pubConfig, targetPlacementObj, objectId, true);
        }

        if (auctionJson == null || auctionJson.isEmpty()) {
            return null;
        }

        return Base64.encodeToString(auctionJson.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
    }

    private String requestUnityAuctionLoad(
            String gameId,
            JSONObject pubConfig,
            JSONObject placementConfig,
            String objectId,
            boolean useTestEndpoint
    ) throws Exception {
        Context ctx = getContext();
        int screenWidth = 1080;
        int screenHeight = 2400;
        int screenDensity = 420;
        if (ctx != null && ctx.getResources() != null) {
            DisplayMetrics dm = ctx.getResources().getDisplayMetrics();
            if (dm != null) {
                screenWidth = dm.widthPixels > 0 ? dm.widthPixels : 1080;
                screenHeight = dm.heightPixels > 0 ? dm.heightPixels : 2400;
                screenDensity = dm.densityDpi > 0 ? dm.densityDpi : 420;
            }
        }

        String baseUrl = useTestEndpoint
                ? "https://auction.unityads.unity3d.com/v6/test/games/" + URLEncoder.encode(gameId, "UTF-8") + "/requests"
                : "https://auction-load.unityads.unity3d.com/v6/games/" + URLEncoder.encode(gameId, "UTF-8") + "/requests";

        StringBuilder urlBuilder = new StringBuilder(baseUrl);
        urlBuilder.append("?platform=android&sdkVersion=41500");
        if (useTestEndpoint) {
            urlBuilder.append("&test=true");
        }
        urlBuilder.append("&deviceModel=").append(URLEncoder.encode(Build.MODEL != null ? Build.MODEL : "Android", "UTF-8"));
        urlBuilder.append("&deviceMake=").append(URLEncoder.encode(Build.MANUFACTURER != null ? Build.MANUFACTURER : "Google", "UTF-8"));
        urlBuilder.append("&apiLevel=").append(Build.VERSION.SDK_INT);
        urlBuilder.append("&osVersion=").append(URLEncoder.encode(Build.VERSION.RELEASE != null ? Build.VERSION.RELEASE : "14", "UTF-8"));
        urlBuilder.append("&screenWidth=").append(screenWidth);
        urlBuilder.append("&screenHeight=").append(screenHeight);
        urlBuilder.append("&screenDensity=").append(screenDensity);
        urlBuilder.append("&screenSize=268435794&connectionType=wifi&networkType=13&stores=google");

        String placementId = placementConfig.optString("id", REWARDED_PLACEMENT);
        JSONObject placementSpec = new JSONObject();
        JSONArray adTypes = placementConfig.optJSONArray("adTypes");
        if (adTypes == null) {
            adTypes = new JSONArray();
            adTypes.put("VAST");
            adTypes.put("MRAID");
            adTypes.put("VIDEO");
            adTypes.put("PLAYABLE");
        }
        placementSpec.put("adTypes", adTypes);
        placementSpec.put("adUnitId", placementConfig.optString("adUnitId", placementId));
        placementSpec.put("allowSkip", placementConfig.optBoolean("allowSkip", false));
        placementSpec.put("auctionType", placementConfig.optString("auctionType", "cpm"));
        placementSpec.put("adFormat", placementConfig.optString("adFormat", "rewarded"));
        placementSpec.put("placementType", placementConfig.optString("placementType", "bidding"));

        JSONObject placementsMap = new JSONObject();
        placementsMap.put(placementId, placementSpec);

        JSONObject objectIdsMap = new JSONObject();
        objectIdsMap.put(objectId, placementId);

        String bundleId = ctx != null ? ctx.getPackageName() : "com.vikashgamboge.arrowmaster";

        JSONObject reqBody = new JSONObject();
        reqBody.put("bundleVersion", "14.0");
        reqBody.put("bundleId", bundleId);
        reqBody.put("language", Locale.getDefault().getLanguage());
        reqBody.put("gameSessionId", gameSessionId);
        reqBody.put("timeZone", TimeZone.getDefault().getID());
        reqBody.put("clientTs", System.currentTimeMillis());
        reqBody.put("properties", pubConfig.optString("properties", ""));
        reqBody.put("token", pubConfig.optString("token", ""));
        reqBody.put("coppa", pubConfig.optBoolean("coppaCompliant", false));
        reqBody.put("projectId", pubConfig.optString("projectId", ""));
        reqBody.put("organizationId", pubConfig.optString("organizationId", ""));
        if (pubConfig.has("developerId")) {
            reqBody.put("developerId", pubConfig.optLong("developerId"));
        }
        reqBody.put("headerBidding", true);
        reqBody.put("load", true);
        reqBody.put("preload", true);
        reqBody.put("preloadPlacements", placementsMap);
        reqBody.put("placements", placementsMap);
        reqBody.put("preloadData", new JSONObject());
        reqBody.put("objectIds", objectIdsMap);

        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlBuilder.toString());
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");

            byte[] payloadBytes = reqBody.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(payloadBytes);
                os.flush();
            }

            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                String responseText = readStream(conn.getInputStream());
                JSONObject respJson = new JSONObject(responseText);
                if (respJson.has("auctionId") && respJson.has("media")) {
                    return responseText;
                }
                Log.w(TAG, "Auction response missing media for " + placementId + ": " + responseText);
            } else {
                String errText = readStream(conn.getErrorStream());
                Log.w(TAG, "Auction load HTTP " + status + " for " + placementId + ": " + errText);
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
        return null;
    }

    private String readStream(InputStream is) throws Exception {
        if (is == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    private void resolvePendingLoadCalls(String primaryPlacement, String actualPlacement) {
        List<PluginCall> calls;
        synchronized (pendingLoadCalls) {
            calls = pendingLoadCalls.remove(primaryPlacement);
        }
        if (calls != null) {
            for (PluginCall c : calls) {
                try {
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("placementId", primaryPlacement);
                    ret.put("resolvedPlacementId", actualPlacement);
                    c.resolve(ret);
                } catch (Exception ignored) {}
            }
        }
    }

    private void rejectPendingLoadCalls(String primaryPlacement, String code, String message) {
        List<PluginCall> calls;
        synchronized (pendingLoadCalls) {
            calls = pendingLoadCalls.remove(primaryPlacement);
        }
        if (calls != null) {
            for (PluginCall c : calls) {
                try {
                    c.reject(code, message);
                } catch (Exception ignored) {}
            }
        }
    }

    @PluginMethod
    public void isAdLoaded(PluginCall call) {
        String requestedPlacement = call.getString("placementId", REWARDED_PLACEMENT);
        String placementId = normalizePlacementId(requestedPlacement);
        boolean isLoaded = loadedPlacements.contains(placementId);
        boolean isLoading = loadingPlacements.contains(placementId) || isInitializing.get();

        JSObject ret = new JSObject();
        ret.put("loaded", isLoaded);
        ret.put("loading", isLoading);
        ret.put("initialized", UnityAds.isInitialized());
        ret.put("initializing", isInitializing.get());
        ret.put("resolvedPlacementId", placementId);
        if (lastLoadErrors.containsKey(placementId)) {
            ret.put("lastError", lastLoadErrors.get(placementId));
        } else if (lastInitError != null) {
            ret.put("lastError", lastInitError);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void showAd(PluginCall call) {
        String requestedPlacement = call.getString("placementId", REWARDED_PLACEMENT);
        if (requestedPlacement == null || requestedPlacement.trim().isEmpty()) {
            call.reject("INVALID_ARGUMENT", "Placement ID is required");
            return;
        }

        if (isShowingAd.get()) {
            Log.w(TAG, "An ad is already currently displaying");
            call.reject("ALREADY_SHOWING", "An ad is already currently displaying.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) {
            Log.e(TAG, "Activity is not available to display ad");
            call.reject("ACTIVITY_UNAVAILABLE", "Activity is not available to display ad");
            return;
        }

        final String placementId = normalizePlacementId(requestedPlacement);

        if (!loadedPlacements.contains(placementId)) {
            Log.w(TAG, "showAd called when placement not yet loaded: " + placementId + ". Triggering load now...");
            enqueueAndLoadPlacement(placementId, null, true);
            String lastErr = lastLoadErrors.get(placementId);
            call.reject("NOT_READY", lastErr != null
                    ? "Ad not ready (" + lastErr + ")"
                    : "Advertisement is still loading. Please try again in a moment.");
            return;
        }

        final String objectId = loadedObjectIds.get(placementId);

        isShowingAd.set(true);
        Log.i(TAG, "Showing Unity Ad for placement: " + placementId + " (objectId=" + objectId + ")");

        activity.runOnUiThread(() -> {
            try {
                UnityAdsShowOptions showOptions = new UnityAdsShowOptions();
                if (objectId != null && !objectId.isEmpty()) {
                    showOptions.setObjectId(objectId);
                }

                UnityAds.show(activity, placementId, showOptions, new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String pId, UnityAds.UnityAdsShowError error, String message) {
                        isShowingAd.set(false);
                        loadedPlacements.remove(pId);
                        loadedPlacements.remove(placementId);
                        loadedObjectIds.remove(pId);
                        loadedObjectIds.remove(placementId);
                        String errDetail = error.name() + ": " + message;
                        lastLoadErrors.put(placementId, errDetail);
                        Log.e(TAG, "Unity Ad show failed for " + pId + " [" + error.name() + "]: " + message);

                        triggerBackgroundReload(placementId);
                        call.reject("SHOW_FAILED", "Unity Ads Show Error [" + error.name() + "]: " + message);
                    }

                    @Override
                    public void onUnityAdsShowStart(String pId) {
                        Log.i(TAG, "Unity Ad show started for " + pId);
                    }

                    @Override
                    public void onUnityAdsShowClick(String pId) {
                        Log.d(TAG, "Unity Ad clicked: " + pId);
                    }

                    @Override
                    public void onUnityAdsShowComplete(String pId, UnityAds.UnityAdsShowCompletionState state) {
                        isShowingAd.set(false);
                        loadedPlacements.remove(pId);
                        loadedPlacements.remove(placementId);
                        loadedObjectIds.remove(pId);
                        loadedObjectIds.remove(placementId);
                        Log.i(TAG, "Unity Ad show complete for " + pId + ", state: " + state.name());

                        triggerBackgroundReload(placementId);

                        JSObject ret = new JSObject();
                        ret.put("placementId", placementId);
                        ret.put("resolvedPlacementId", pId);
                        ret.put("state", state.name());
                        ret.put("completed", state == UnityAds.UnityAdsShowCompletionState.COMPLETED);
                        ret.put("skipped", state == UnityAds.UnityAdsShowCompletionState.SKIPPED);
                        call.resolve(ret);
                    }
                });
            } catch (Exception e) {
                isShowingAd.set(false);
                loadedPlacements.remove(placementId);
                loadedObjectIds.remove(placementId);
                Log.e(TAG, "Exception during UnityAds.show for: " + placementId, e);
                triggerBackgroundReload(placementId);
                call.reject("SHOW_FAILED", "Exception showing ad: " + e.getMessage());
            }
        });
    }

    private void preloadStandardPlacements() {
        if (!UnityAds.isInitialized()) return;
        Log.d(TAG, "Preloading standard Unity Ads placements (BP_Rewarded_Android & BP_Interstitial_Android)...");
        enqueueAndLoadPlacement(REWARDED_PLACEMENT, null, true);
        enqueueAndLoadPlacement(INTERSTITIAL_PLACEMENT, null, true);
    }

    private void triggerBackgroundReload(String placementId) {
        mainHandler.postDelayed(() -> {
            try {
                if (UnityAds.isInitialized()) {
                    enqueueAndLoadPlacement(placementId, null, true);
                }
            } catch (Exception e) {
                Log.w(TAG, "Background reload failed for: " + placementId, e);
            }
        }, 800);
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        isShowingAd.set(false);
        loadedPlacements.clear();
        loadingPlacements.clear();
        loadedObjectIds.clear();
        synchronized (pendingInitCalls) {
            pendingInitCalls.clear();
        }
        synchronized (pendingAfterInitTasks) {
            pendingAfterInitTasks.clear();
        }
        synchronized (pendingLoadCalls) {
            pendingLoadCalls.clear();
        }
    }
}
