package cn.yuanhuang.worktimeapp;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final WorkTimeNativeBridge nativeBridge = new WorkTimeNativeBridge();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleNativeBack(this);
            }
        });
    }

    @Override
    protected void load() {
        super.load();
        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.addJavascriptInterface(nativeBridge, "WorkTimeNative");
        injectNativeShellState(webView);
    }

    private void handleNativeBack(OnBackPressedCallback callback) {
        WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) {
            callback.setEnabled(false);
            getOnBackPressedDispatcher().onBackPressed();
            callback.setEnabled(true);
            return;
        }
        webView.evaluateJavascript(
            "(() => {" +
                "const shell = window.WorkTimeNativeShell || window.WorkTimeHarmonyShell;" +
                "if (shell && typeof shell.consumeBack === 'function') return shell.consumeBack() === true;" +
                "return false;" +
            "})()",
            result -> {
                if ("true".equals(result)) return;
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    callback.setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    callback.setEnabled(true);
                }
            }
        );
    }

    private void injectNativeShellState(WebView webView) {
        webView.evaluateJavascript(
            "(() => {" +
                "const root = document.documentElement;" +
                "root.dataset.platform = 'android';" +
                "root.dataset.nativeShell = 'android';" +
                "root.dataset.nativeMaterial = 'android-liquid-glass';" +
                "window.WorkTimeNativeShell = window.WorkTimeNativeShell || {};" +
                "window.WorkTimeNativeShell.info = { platform: 'android', shellName: 'capacitor-android', material: 'Kyant0/AndroidLiquidGlass-ready' };" +
                "window.dispatchEvent(new CustomEvent('worktime:native-shell', { detail: window.WorkTimeNativeShell.info }));" +
                "true;" +
            "})()",
            null
        );
    }

    public static class WorkTimeNativeBridge {
        @JavascriptInterface
        public String getPlatform() {
            return "android";
        }

        @JavascriptInterface
        public String getShellInfo() {
            return "{\"platform\":\"android\",\"shellName\":\"capacitor-android\",\"material\":\"Kyant0/AndroidLiquidGlass-ready\"}";
        }

        @JavascriptInterface
        public String setHandedness(String value) {
            return ("left".equals(value) || "right".equals(value)) ? value : "auto";
        }
    }
}
