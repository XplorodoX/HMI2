"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

// We import dynamically to avoid SSR issues with the Epic library.
// We use 'any' to bypass strict type checks for the library internals 
// as we cannot easily verify the exact exports in this environment.

export interface PixelStreamingPlayerRef {
    emitUIInteraction: (data: object) => void;
}

const PixelStreamingPlayer = forwardRef<PixelStreamingPlayerRef, {}>((props, ref) => {
    const videoParentRef = useRef<HTMLDivElement>(null);
    const [psInstance, setPsInstance] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
        emitUIInteraction: (data: object) => {
            if (psInstance) {
                console.log("Sending data to UE:", data);
                // Depending on the library version, emitUIInteraction might be on the stream or application
                // We try safe access
                if (typeof psInstance.emitUIInteraction === 'function') {
                    psInstance.emitUIInteraction(data);
                } else if (psInstance.stream && typeof psInstance.stream.emitUIInteraction === 'function') {
                    psInstance.stream.emitUIInteraction(data);
                } else {
                    console.warn("emitUIInteraction method not found on PS instance");
                }
            } else {
                console.warn("Pixel Streaming instance not ready");
            }
        }
    }));

    useEffect(() => {
        const loadLib = async () => {
            if (typeof window === 'undefined') return;
            if (isLoaded) return;

            try {
                // Import as any
                const PS: any = await import('@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.4');

                // Config usually expects an object
                // We use 'any' to suppress "Config does not exist"
                // Defensive Config initialization
                let config: any = null;
                if (PS.Config) {
                    config = new PS.Config({
                        initialSettings: {
                            AutoPlayVideo: true,
                            AutoConnect: true,
                            StartVideoMuted: true,
                            HoveringMouse: true,
                            WaitForStreamer: true,
                        }
                    });
                } else if (PS.ConfigUI) {
                    // ConfigUI expects an object with a getFlags method. Provide a minimal stub if missing.
                    const configUIOptions: any = {
                        initialSettings: {
                            AutoPlayVideo: true,
                            AutoConnect: true,
                            StartVideoMuted: true,
                            HoveringMouse: true,
                            WaitForStreamer: true,
                        }
                    };
                    if (typeof PS.ConfigUI.prototype.getFlags === 'function' || typeof PS.ConfigUI.getFlags === 'function') {
                        config = new PS.ConfigUI(configUIOptions);
                    } else {
                        // Fallback: use Config if ConfigUI is not compatible
                        config = new PS.Config(configUIOptions);
                    }
                } else {
                    console.warn('Pixel Streaming Config class not found; skipping initialization.');
                }

                // Check for PixelStreaming class or similar
                let stream: any = null;
                if (config) {
                    const StreamClass = PS.PixelStreaming;
                    stream = new StreamClass(config);
                } else {
                    console.warn('Config not available; cannot create PixelStreaming stream.');
                }

                // Application wrapper
                const AppClass = PS.Application;
                const application = new AppClass({
                    stream: stream,
                    onColorModeChanged: (isLightMode: boolean) => { },
                    settingsPanelConfig: { visibility: false } // Use 'any' if strict check fails
                } as any);

                if (videoParentRef.current) {
                    videoParentRef.current.appendChild(application.rootElement);
                }

                // Store the stream or application for later use
                setPsInstance(stream);
                setIsLoaded(true);

            } catch (error) {
                console.error("Failed to load Pixel Streaming library:", error);
            }
        };

        loadLib();

        return () => {
            // Cleanup if needed
        }
    }, []);

    return (
        <div
            ref={videoParentRef}
            className="pixel-streaming-container"
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        />
    );
});

PixelStreamingPlayer.displayName = "PixelStreamingPlayer";

export default PixelStreamingPlayer;
